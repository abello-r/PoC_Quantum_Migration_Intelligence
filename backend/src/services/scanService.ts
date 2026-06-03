import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { RepositoryScannerAdapter } from "../scanners/repositoryScannerAdapter.js";
import type { ScannerAdapter, ScanProgress } from "../scanners/scannerAdapter.js";
import type { NormalizedFinding } from "../types/domain.js";
import { fetchGitHubRepositoryMetadata, type GitHubRepositoryMetadata } from "./githubRepositoryService.js";
import { generateMigrationPlan } from "./migrationPlanService.js";
import { calculateReadinessScore, summarizeRisks } from "./readinessService.js";

const scanInclude = {
  findings: true,
  recommendations: {
    orderBy: {
      priority: "asc"
    }
  }
} satisfies Prisma.ScanInclude;

export class ScanService {
  constructor(private readonly scannerAdapter: ScannerAdapter = new RepositoryScannerAdapter()) {}

  async createRepositoryScan(repositoryUrl: string) {
    const repositoryMetadata = await fetchGitHubRepositoryMetadata(repositoryUrl);
    const scan = await prisma.scan.create({
      data: {
        target: repositoryUrl,
        ...toRepositoryMetadataCreateInput(repositoryMetadata),
        status: "running",
        stage: "queued",
        progress: 0,
        lastMessage: "scanQueued",
        startedAt: new Date()
      }
    });

    void this.runScan(scan.id, repositoryUrl, this.scannerAdapter);

    return this.getScan(scan.id);
  }

  async listScans() {
    const scans = await prisma.scan.findMany({
      orderBy: {
        createdAt: "desc"
      },
      include: {
        findings: true,
        recommendations: true
      }
    });

    return scans.map(toScanSummary);
  }

  async getScan(id: string) {
    const scan = await prisma.scan.findUnique({
      where: {
        id
      },
      include: scanInclude
    });

    return scan ? toScanDetail(scan) : null;
  }

  async getFindings(id: string) {
    return prisma.finding.findMany({
      where: {
        scanId: id
      },
      orderBy: [
        {
          riskLevel: "asc"
        },
        {
          createdAt: "asc"
        }
      ]
    });
  }

  async getMigrationPlan(id: string) {
    return prisma.migrationRecommendation.findMany({
      where: {
        scanId: id
      },
      orderBy: {
        priority: "asc"
      }
    });
  }

  private async runScan(scanId: string, repositoryUrl: string, adapter: ScannerAdapter) {
    try {
      const result = await adapter.scan(repositoryUrl, {
        onProgress: (progress) => this.updateScanProgress(scanId, progress)
      });
      const score = calculateReadinessScore(result.findings);
      const recommendations = generateMigrationPlan(result.findings);

      await this.updateScanProgress(scanId, {
        stage: "planning",
        progress: 90,
        message: "generatingMigrationPlan",
        ...result.coverage
      });

      await prisma.$transaction([
        prisma.finding.deleteMany({
          where: {
            scanId
          }
        }),
        prisma.migrationRecommendation.deleteMany({
          where: {
            scanId
          }
        }),
        prisma.finding.createMany({
          data: result.findings.map((finding) => toFindingCreateInput(scanId, finding))
        }),
        prisma.migrationRecommendation.createMany({
          data: recommendations.map((recommendation) => ({
            scanId,
            ...recommendation
          }))
        }),
        prisma.scan.update({
          where: {
            id: scanId
          },
          data: {
            status: "completed",
            stage: "completed",
            progress: 100,
            score,
            finishedAt: new Date(),
            errorMessage: null,
            lastMessage: result.findings.length > 0 ? "scanCompleted" : "scanCompletedWithoutFindings",
            ...result.coverage
          }
        })
      ]);
    } catch (error) {
      await prisma.scan.update({
        where: {
          id: scanId
        },
        data: {
          status: "failed",
          stage: "failed",
          progress: 100,
          finishedAt: new Date(),
          lastMessage: "scanFailed",
          errorMessage: error instanceof Error ? error.message : "Scan failed"
        }
      });
    }
  }

  private async updateScanProgress(scanId: string, progress: ScanProgress) {
    await prisma.scan.update({
      where: {
        id: scanId
      },
      data: {
        stage: progress.stage,
        progress: progress.progress,
        lastMessage: progress.message,
        filesDiscovered: progress.filesDiscovered,
        filesCandidates: progress.filesCandidates,
        filesScanned: progress.filesScanned,
        filesSkipped: progress.filesSkipped,
        scanLimitApplied: progress.scanLimitApplied
      }
    });
  }
}

type ScanWithRelations = Prisma.ScanGetPayload<{
  include: typeof scanInclude;
}>;

function toScanSummary(scan: ScanWithRelations | Awaited<ReturnType<typeof prisma.scan.findMany>>[number]) {
  const findings = "findings" in scan ? scan.findings : [];

  return {
    id: scan.id,
    target: scan.target,
    repositoryOwner: scan.repositoryOwner,
    repositoryName: scan.repositoryName,
    repositoryFullName: scan.repositoryFullName,
    repositoryAvatarUrl: scan.repositoryAvatarUrl,
    repositoryDefaultBranch: scan.repositoryDefaultBranch,
    repositoryLanguage: scan.repositoryLanguage,
    repositoryVisibility: scan.repositoryVisibility,
    repositorySizeKb: scan.repositorySizeKb,
    repositoryPushedAt: scan.repositoryPushedAt,
    status: scan.status,
    stage: scan.stage,
    progress: scan.progress,
    filesDiscovered: scan.filesDiscovered,
    filesCandidates: scan.filesCandidates,
    filesScanned: scan.filesScanned,
    filesSkipped: scan.filesSkipped,
    scanLimitApplied: scan.scanLimitApplied,
    lastMessage: scan.lastMessage,
    score: scan.status === "completed" ? calculateReadinessScore(findings) : scan.score,
    errorMessage: scan.errorMessage,
    createdAt: scan.createdAt,
    startedAt: scan.startedAt,
    finishedAt: scan.finishedAt,
    riskSummary: summarizeRisks(findings)
  };
}

function toScanDetail(scan: ScanWithRelations) {
  return {
    ...toScanSummary(scan),
    findings: scan.findings,
    recommendations: scan.recommendations
  };
}

function toFindingCreateInput(scanId: string, finding: NormalizedFinding) {
  return {
    scanId,
    algorithm: finding.algorithm,
    category: finding.category,
    riskLevel: finding.riskLevel,
    fileContext: finding.fileContext,
    filePath: finding.filePath,
    line: finding.line,
    confidence: finding.confidence,
    sourceTool: finding.sourceTool,
    rawMetadata: finding.rawMetadata as Prisma.InputJsonValue | undefined
  };
}

function toRepositoryMetadataCreateInput(metadata: GitHubRepositoryMetadata) {
  return {
    repositoryOwner: metadata.owner,
    repositoryName: metadata.name,
    repositoryFullName: metadata.fullName,
    repositoryAvatarUrl: metadata.avatarUrl,
    repositoryDefaultBranch: metadata.defaultBranch,
    repositoryLanguage: metadata.language,
    repositoryVisibility: metadata.visibility,
    repositorySizeKb: metadata.sizeKb,
    repositoryPushedAt: metadata.pushedAt
  };
}

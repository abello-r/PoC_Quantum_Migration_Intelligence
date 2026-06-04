import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import type { FileContext, NormalizedFinding, RiskLevel } from "../types/domain.js";
import type { ScannerAdapter, ScannerContext, ScannerResult, ScanCoverage } from "./scannerAdapter.js";

const execFileAsync = promisify(execFile);
const cryptoScanCommand = process.env.CRYPTOSCAN_BIN ?? "cryptoscan";
const cryptoScanTimeoutMs = readPositiveInteger("CRYPTOSCAN_TIMEOUT_MS", 180_000);
const cryptoScanFallbackEnabled = process.env.CRYPTOSCAN_DISABLE_FALLBACK !== "true";

export class CryptoScanAdapter implements ScannerAdapter {
  constructor(private readonly fallbackAdapter?: ScannerAdapter) {}

  async scan(repositoryUrl: string, context: ScannerContext = {}): Promise<ScannerResult> {
    const workspace = await mkdtemp(join(tmpdir(), "cryptoscan-output-"));
    const outputPath = join(workspace, "findings.json");

    try {
      let progress = 20;
      await report(context, {
        stage: "analyzing",
        progress,
        message: "analyzingCandidateFiles"
      });
      const startedAt = Date.now();
      const progressInterval = setInterval(() => {
        if (context.signal?.aborted) {
          return;
        }

        progress = calculateTimedProgress(20, 82, startedAt, cryptoScanTimeoutMs);
        void report(context, {
          stage: "analyzing",
          progress,
          message: "analyzingCandidateFiles"
        });
      }, 2500);

      try {
        await execFileAsync(cryptoScanCommand, ["scan", repositoryUrl, "--format", "json", "--output", outputPath, "--no-color"], {
          timeout: cryptoScanTimeoutMs,
          maxBuffer: 25 * 1024 * 1024,
          signal: context.signal
        });
      } finally {
        clearInterval(progressInterval);
      }

      await report(context, {
        stage: "analyzing",
        progress: 82,
        message: "analyzingCandidateFiles"
      });

      const rawOutput = await readFile(outputPath, "utf8");
      const result = parseCryptoScanOutput(rawOutput);

      return {
        target: repositoryUrl,
        findings: dedupeFindings(result.findings),
        coverage: result.coverage,
        score: result.score
      };
    } catch (error) {
      if (context.signal?.aborted) {
        throw error;
      }

      if (this.fallbackAdapter && cryptoScanFallbackEnabled) {
        await report(context, {
          stage: "analyzing",
          progress: 18,
          message: "analyzingCandidateFiles"
        });

        return this.fallbackAdapter.scan(repositoryUrl, context);
      }

      throw new Error(formatCryptoScanError(error));
    } finally {
      await rm(workspace, {
        force: true,
        recursive: true
      });
    }
  }
}

function parseCryptoScanOutput(rawOutput: string) {
  const parsed = JSON.parse(rawOutput) as unknown;
  const root = asRecord(parsed);
  const rawFindings = findArray(root, ["findings", "results", "matches", "issues"]) ?? [];
  const findings = rawFindings.map(normalizeCryptoScanFinding).filter((finding): finding is NormalizedFinding => finding !== null);
  const coverage = getCoverage(root, findings.length);
  const score = getReadinessScore(root);

  return {
    findings,
    coverage,
    score
  };
}

function normalizeCryptoScanFinding(rawFinding: unknown): NormalizedFinding | null {
  const finding = asRecord(rawFinding);

  if (!finding) {
    return null;
  }

  const location = asRecord(finding.location) ?? asRecord(finding.position) ?? {};
  const algorithm = firstString(finding, ["algorithm", "algorithmName", "name", "patternName", "title", "ruleId", "id"]) ?? "Unknown";
  const category = normalizeCategory(firstString(finding, ["category", "type", "class", "family"]) ?? "unknown");
  const filePath = normalizeCryptoScanFilePath(
    firstString(finding, ["file", "filePath", "path", "filename", "uri"]) ?? firstString(location, ["file", "filePath", "path", "uri"])
  );
  const line = firstNumber(finding, ["line", "lineNumber", "startLine"]) ?? firstNumber(location, ["line", "lineNumber", "startLine"]);
  const confidence = normalizeConfidence(firstNumber(finding, ["confidence", "score", "confidenceScore"]));
  const riskLevel = normalizeRiskLevel(finding);

  return {
    algorithm,
    category,
    riskLevel,
    fileContext: classifyFileContext(filePath),
    filePath,
    line,
    confidence,
    sourceTool: "cryptoscan",
    rawMetadata: {
      cryptoScanFinding: finding
    }
  };
}

function getCoverage(root: Record<string, unknown> | null, findingCount: number): ScanCoverage {
  const summary = asRecord(root?.summary) ?? asRecord(root?.stats) ?? asRecord(root?.metadata) ?? root;
  const filesScanned = firstNumber(summary, ["filesScanned", "scannedFiles", "files_analyzed", "filesAnalyzed", "totalFiles"]) ?? 0;
  const filesDiscovered = firstNumber(summary, ["filesDiscovered", "discoveredFiles", "totalFiles", "filesTotal"]) ?? filesScanned;
  const filesSkipped = firstNumber(summary, ["filesSkipped", "skippedFiles"]) ?? 0;

  return {
    filesDiscovered,
    filesCandidates: filesScanned || filesDiscovered,
    filesScanned,
    filesSkipped,
    scanLimitApplied: false
  };
}

function getReadinessScore(root: Record<string, unknown> | null) {
  const summary = asRecord(root?.summary) ?? asRecord(root?.stats) ?? asRecord(root?.metadata) ?? root;
  const score =
    firstNumber(summary, ["readinessScore", "migrationReadinessScore", "score", "readiness", "migration_readiness_score"]) ??
    firstNumber(root, ["readinessScore", "migrationReadinessScore", "score", "readiness", "migration_readiness_score"]);

  if (score == null || Number.isNaN(score)) {
    return undefined;
  }

  const normalizedScore = score > 1 ? score : score * 100;

  return Math.max(0, Math.min(100, Math.round(normalizedScore)));
}

function normalizeRiskLevel(finding: Record<string, unknown>): RiskLevel {
  const risk = firstString(finding, ["riskLevel", "quantumRisk", "quantum_risk", "risk", "severity", "level"])?.toLowerCase() ?? "";
  const severity = firstString(finding, ["severity", "level"])?.toLowerCase() ?? "";
  const combined = `${risk} ${severity}`;

  if (combined.includes("critical")) {
    return "critical";
  }

  if (combined.includes("vulnerable") || combined.includes("high")) {
    return "vulnerable";
  }

  if (combined.includes("partial") || combined.includes("medium")) {
    return "partial";
  }

  if (combined.includes("hybrid")) {
    return "hybrid";
  }

  if (combined.includes("safe") || combined.includes("low") || combined.includes("info")) {
    return "safe";
  }

  return "unknown";
}

function normalizeCategory(category: string) {
  return category.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "unknown";
}

function normalizeCryptoScanFilePath(filePath: string | undefined) {
  if (!filePath) {
    return undefined;
  }

  const normalizedPath = filePath.replace(/^file:\/\//, "").replace(/\\/g, "/").replace(/^\.\/+/, "");
  const cryptoScanTempMatch = normalizedPath.match(/(?:^|\/)tmp\/cryptoscan-[^/]+\/(.+)$/);

  if (cryptoScanTempMatch?.[1]) {
    return cryptoScanTempMatch[1].replace(/^\/+/, "");
  }

  return normalizedPath.replace(/^\/+/, "");
}

function normalizeConfidence(confidence: number | undefined) {
  if (confidence == null || Number.isNaN(confidence)) {
    return 0.72;
  }

  const normalized = confidence > 1 ? confidence / 100 : confidence;

  return Math.max(0.05, Math.min(1, Number(normalized.toFixed(2))));
}

function classifyFileContext(path: string | undefined): FileContext {
  if (!path) {
    return "unknown";
  }

  const normalizedPath = path.toLowerCase();
  const segments = normalizedPath.split("/");
  const fileName = segments[segments.length - 1] ?? "";

  if (segments.some((segment) => ["vendor", "generated", "dist", "build", "coverage"].includes(segment))) {
    return "generated";
  }

  if (segments.some((segment) => ["test", "tests", "__tests__", "spec", "fixtures", "fixture"].includes(segment))) {
    return "test";
  }

  if (segments.some((segment) => ["example", "examples", "sample", "samples", "demo", "demos"].includes(segment))) {
    return "example";
  }

  if (segments.some((segment) => ["doc", "docs", "documentation"].includes(segment)) || ["readme", "changelog", "license", "notice", "contributing", "security"].some((stem) => fileName.startsWith(stem))) {
    return "documentation";
  }

  if (["package.json", "package-lock.json", "yarn.lock", "pnpm-lock.yaml", "go.mod", "go.sum", "cargo.toml", "cargo.lock", "pom.xml", "build.gradle", "requirements.txt", "poetry.lock"].includes(fileName)) {
    return "dependency-manifest";
  }

  if (/\.(json|ya?ml)$/.test(fileName)) {
    return "configuration";
  }

  if (/\.(c|cc|cpp|cs|go|h|java|js|jsx|kt|py|rb|rs|ts|tsx)$/.test(fileName)) {
    return "source-code";
  }

  return "unknown";
}

function dedupeFindings(findings: NormalizedFinding[]) {
  const seen = new Set<string>();

  return findings.filter((finding) => {
    const key = `${finding.algorithm}:${finding.filePath ?? ""}:${finding.line ?? ""}:${finding.category}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function findArray(root: Record<string, unknown> | null, keys: string[]) {
  for (const key of keys) {
    const value = root?.[key];

    if (Array.isArray(value)) {
      return value;
    }
  }

  return null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function firstString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }

  return undefined;
}

function firstNumber(record: Record<string, unknown> | null, keys: string[]) {
  for (const key of keys) {
    const value = record?.[key];

    if (typeof value === "number") {
      return value;
    }

    if (typeof value === "string" && value.trim().length > 0) {
      const parsed = Number(value);

      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
  }

  return undefined;
}

function formatCryptoScanError(error: unknown) {
  const message = extractCommandOutput(error);

  if (message.includes("ENOENT")) {
    return "CryptoScan is not installed in the scanner container. Rebuild the backend image with CryptoScan support.";
  }

  if (message.includes("timed out") || message.includes("SIGTERM")) {
    return "CryptoScan timed out while analyzing this repository.";
  }

  return `CryptoScan failed.${message.trim() ? ` ${message.trim()}` : ""}`;
}

function extractCommandOutput(error: unknown) {
  if (!error || typeof error !== "object") {
    return "";
  }

  const record = error as Record<string, unknown>;
  const stderr = typeof record.stderr === "string" ? record.stderr : "";
  const stdout = typeof record.stdout === "string" ? record.stdout : "";
  const message = error instanceof Error ? error.message : "";

  return `${stderr}\n${stdout}\n${message}`;
}

async function report(context: ScannerContext, progress: Parameters<NonNullable<ScannerContext["onProgress"]>>[0]) {
  if (context.signal?.aborted) {
    return;
  }

  await context.onProgress?.(progress);
}

function readPositiveInteger(name: string, fallback: number) {
  const value = Number(process.env[name]);

  return Number.isInteger(value) && value > 0 ? value : fallback;
}

function calculateTimedProgress(start: number, end: number, startedAt: number, timeoutMs: number) {
  const elapsedRatio = Math.min((Date.now() - startedAt) / timeoutMs, 1);

  return Math.min(end - 1, start + Math.round((end - start) * elapsedRatio));
}

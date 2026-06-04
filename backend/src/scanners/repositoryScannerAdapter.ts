import { execFile } from "node:child_process";
import { mkdtemp, readdir, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { promisify } from "node:util";
import type { FileContext, NormalizedFinding, RiskLevel } from "../types/domain.js";
import type { ScannerAdapter, ScannerContext, ScannerResult, ScanCoverage } from "./scannerAdapter.js";

const execFileAsync = promisify(execFile);
const maxFilesToAnalyze = readPositiveInteger("SCAN_MAX_FILES", 5000);
const maxFileBytes = readPositiveInteger("SCAN_MAX_FILE_BYTES", 1_000_000);
const supportedExtensions = new Set([
  ".c",
  ".cc",
  ".cpp",
  ".cs",
  ".go",
  ".h",
  ".java",
  ".js",
  ".json",
  ".jsx",
  ".kt",
  ".md",
  ".mdx",
  ".py",
  ".rb",
  ".rs",
  ".ts",
  ".tsx",
  ".yaml",
  ".yml"
]);
const documentationFileNames = new Set(["readme", "changelog", "license", "notice", "contributing", "security"]);
const dependencyManifestFileNames = new Set(["package.json", "package-lock.json", "yarn.lock", "pnpm-lock.yaml", "go.mod", "go.sum", "cargo.toml", "cargo.lock", "pom.xml", "build.gradle", "requirements.txt", "poetry.lock"]);

const cryptoRules = [
  rule("RSA", "asymmetric-signature", "vulnerable", /\bRSA(?:[-_ ]?\d{3,4})?\b|RSASSA|rsa-sha/i),
  rule("ECDSA", "asymmetric-signature", "vulnerable", /\bECDSA\b|ecdsa-with-SHA/i),
  rule("ECDH", "key-exchange", "critical", /\bECDH\b|\bECDHE\b/i),
  rule("DH", "key-exchange", "critical", /\bDiffie[- ]Hellman\b|\bDHE\b/i),
  rule("Ed25519", "asymmetric-signature", "vulnerable", /\bEd25519\b/i),
  rule("AES-128", "symmetric-encryption", "partial", /\bAES[-_ ]?128\b|aes-128/i),
  rule("SHA-256", "hashing", "hybrid", /\bSHA[-_ ]?256\b|sha256/i),
  rule("HMAC-SHA256", "message-authentication", "hybrid", /\bHMAC[-_ ]?SHA[-_ ]?256\b|hmacsha256/i),
  rule("MD5", "deprecated-hashing", "critical", /\bMD5\b|md5\(/i),
  rule("SHA-1", "deprecated-hashing", "critical", /\bSHA[-_ ]?1\b|sha1/i),
  rule("3DES", "deprecated-encryption", "critical", /\b3DES\b|\bDESede\b|triple[-_ ]des/i),
  rule("RC4", "deprecated-encryption", "critical", /\bRC4\b/i),
  rule("AES-256", "symmetric-encryption", "safe", /\bAES[-_ ]?256\b|aes-256/i)
];

export class RepositoryScannerAdapter implements ScannerAdapter {
  async scan(repositoryUrl: string, context: ScannerContext = {}): Promise<ScannerResult> {
    const workspace = await mkdtemp(join(tmpdir(), "quantum-scan-"));

    try {
      throwIfAborted(context);
      await report(context, {
        stage: "cloning",
        progress: 8,
        message: "cloningRepository"
      });
      await cloneRepository(repositoryUrl, workspace, context);
      throwIfAborted(context);
      await report(context, {
        stage: "discovering",
        progress: 20,
        message: "discoveringFiles"
      });
      const result = await scanDirectory(workspace, context);

      return {
        target: repositoryUrl,
        findings: result.findings,
        coverage: result.coverage
      };
    } finally {
      await rm(workspace, {
        force: true,
        recursive: true
      });
    }
  }
}

async function cloneRepository(repositoryUrl: string, workspace: string, context: ScannerContext) {
  let progress = 8;
  const cloneTimeoutMs = 120_000;
  const startedAt = Date.now();
  const progressInterval = setInterval(() => {
    if (context.signal?.aborted) {
      return;
    }

    progress = calculateTimedProgress(8, 28, startedAt, cloneTimeoutMs);
    void report(context, {
      stage: "cloning",
      progress,
      message: "cloningRepository"
    });
  }, 3000);

  try {
    await execFileAsync("git", ["clone", "--depth", "1", repositoryUrl, workspace], {
      timeout: cloneTimeoutMs,
      maxBuffer: 10 * 1024 * 1024,
      signal: context.signal
    });
  } catch (error) {
    if (context.signal?.aborted) {
      throw error;
    }

    throw new Error(formatCloneError(error));
  } finally {
    clearInterval(progressInterval);
  }
}

function formatCloneError(error: unknown) {
  const message = extractCommandOutput(error);

  if (message.includes("could not read Username") || message.includes("Authentication failed")) {
    return "This repository appears to be private or requires authentication. Private repository access is not configured yet.";
  }

  if (message.includes("Repository not found")) {
    return "Repository not found. Check that the URL is correct and that the repository is public.";
  }

  if (message.includes("Could not resolve host") || message.includes("Failed to connect")) {
    return "GitHub could not be reached from the scanner container. Check network access and try again.";
  }

  if (message.includes("timed out") || message.includes("SIGTERM")) {
    return "Repository cloning timed out. Try again or use a smaller repository.";
  }

  if (message.includes("ENOENT")) {
    return "Git is not available in the scanner container. Rebuild the backend image and try again.";
  }

  return "Repository cloning failed. Check that the URL is valid, reachable, and accessible to the scanner.";
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

async function scanDirectory(root: string, context: ScannerContext) {
  const findings: NormalizedFinding[] = [];
  throwIfAborted(context);
  const inventory = await collectFiles(root);
  throwIfAborted(context);
  const prioritizedFiles = prioritizeCandidateFiles(inventory.candidateFiles, root);
  const limitedFiles = prioritizedFiles.slice(0, maxFilesToAnalyze);
  const skippedByLimit = Math.max(prioritizedFiles.length - limitedFiles.length, 0);
  let filesScanned = 0;
  let skippedBySize = 0;

  await report(context, {
    stage: "analyzing",
    progress: 35,
    message: "analyzingCandidateFiles",
    filesDiscovered: inventory.filesDiscovered,
    filesCandidates: inventory.candidateFiles.length,
    filesSkipped: inventory.filesSkipped + skippedByLimit
  });

  for (const file of limitedFiles) {
    throwIfAborted(context);
    const relativePath = relative(root, file);
    const fileContext = classifyFileContext(relativePath);
    const fileStat = await stat(file).catch(() => null);

    if (!fileStat || fileStat.size > maxFileBytes) {
      skippedBySize += 1;
      continue;
    }

    const content = await readFile(file, "utf8").catch(() => "");
    const lines = content.split(/\r?\n/);
    filesScanned += 1;

    lines.forEach((line, index) => {
      for (const cryptoRule of cryptoRules) {
        if (cryptoRule.pattern.test(line)) {
          const confidence = calculateConfidence(fileContext, relativePath, line);
          findings.push({
            algorithm: cryptoRule.algorithm,
            category: cryptoRule.category,
            riskLevel: cryptoRule.riskLevel,
            fileContext,
            filePath: relativePath,
            line: index + 1,
            confidence,
            sourceTool: "repository-pattern-scanner",
            rawMetadata: {
              contextSignals: getContextSignals(fileContext, relativePath, line)
            }
          });
        }
      }
    });

    if (filesScanned % 100 === 0 || filesScanned === limitedFiles.length) {
      await report(context, {
        stage: "analyzing",
        progress: calculateAnalysisProgress(filesScanned, limitedFiles.length),
        message: "analyzingCandidateFiles",
        filesDiscovered: inventory.filesDiscovered,
        filesCandidates: inventory.candidateFiles.length,
        filesScanned,
        filesSkipped: inventory.filesSkipped + skippedByLimit + skippedBySize,
        scanLimitApplied: skippedByLimit > 0
      });
    }
  }

  const coverage = {
    filesDiscovered: inventory.filesDiscovered,
    filesCandidates: inventory.candidateFiles.length,
    filesScanned,
    filesSkipped: inventory.filesSkipped + skippedByLimit + skippedBySize,
    scanLimitApplied: skippedByLimit > 0
  } satisfies ScanCoverage;

  return {
    findings: dedupeFindings(findings),
    coverage
  };
}

type FileInventory = {
  filesDiscovered: number;
  filesSkipped: number;
  candidateFiles: string[];
};

async function collectFiles(directory: string): Promise<FileInventory> {
  const entries = await readdir(directory, {
    withFileTypes: true
  });
  const inventory: FileInventory = {
    filesDiscovered: 0,
    filesSkipped: 0,
    candidateFiles: []
  };

  for (const entry of entries) {
    if (entry.name === ".git" || entry.name === "node_modules" || entry.name === "dist") {
      continue;
    }

    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      const childInventory = await collectFiles(path);
      inventory.filesDiscovered += childInventory.filesDiscovered;
      inventory.filesSkipped += childInventory.filesSkipped;
      inventory.candidateFiles.push(...childInventory.candidateFiles);
    } else {
      inventory.filesDiscovered += 1;

      if (supportedExtensions.has(getExtension(entry.name))) {
        inventory.candidateFiles.push(path);
      } else {
        inventory.filesSkipped += 1;
      }
    }
  }

  return inventory;
}

function dedupeFindings(findings: NormalizedFinding[]) {
  const seen = new Set<string>();

  return findings.filter((finding) => {
    const key = `${finding.algorithm}:${finding.filePath}:${finding.line}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function prioritizeCandidateFiles(files: string[], root: string) {
  return [...files].sort((left, right) => {
    const leftPath = relative(root, left);
    const rightPath = relative(root, right);
    const priorityDifference = getFileScanPriority(leftPath) - getFileScanPriority(rightPath);

    if (priorityDifference !== 0) {
      return priorityDifference;
    }

    return leftPath.localeCompare(rightPath);
  });
}

function getFileScanPriority(path: string) {
  const normalizedPath = path.toLowerCase();
  const context = classifyFileContext(path);
  const contextPriority: Record<FileContext, number> = {
    "source-code": 0,
    configuration: 1,
    "dependency-manifest": 2,
    unknown: 3,
    test: 4,
    example: 5,
    generated: 6,
    documentation: 7
  };
  const securityPathBonus = /(^|\/)(crypto|security|auth|tls|ssl|certs?)(\/|$)/i.test(normalizedPath) ? -1 : 0;

  return contextPriority[context] + securityPathBonus;
}

function getExtension(fileName: string) {
  const index = fileName.lastIndexOf(".");

  return index >= 0 ? fileName.slice(index) : "";
}

function classifyFileContext(path: string): FileContext {
  const normalizedPath = path.toLowerCase();
  const segments = normalizedPath.split("/");
  const fileName = segments[segments.length - 1] ?? "";
  const fileStem = fileName.includes(".") ? fileName.slice(0, fileName.indexOf(".")) : fileName;
  const extension = getExtension(fileName);

  if (segments.some((segment) => ["vendor", "generated", "dist", "build", "coverage"].includes(segment))) {
    return "generated";
  }

  if (segments.some((segment) => ["test", "tests", "__tests__", "spec", "fixtures", "fixture"].includes(segment))) {
    return "test";
  }

  if (segments.some((segment) => ["example", "examples", "sample", "samples", "demo", "demos"].includes(segment))) {
    return "example";
  }

  if (segments.some((segment) => ["doc", "docs", "documentation"].includes(segment)) || documentationFileNames.has(fileStem)) {
    return "documentation";
  }

  if (dependencyManifestFileNames.has(fileName)) {
    return "dependency-manifest";
  }

  if ([".md", ".mdx"].includes(extension)) {
    return "documentation";
  }

  if ([".json", ".yaml", ".yml"].includes(extension)) {
    return "configuration";
  }

  if ([".c", ".cc", ".cpp", ".cs", ".go", ".h", ".java", ".js", ".jsx", ".kt", ".py", ".rb", ".rs", ".ts", ".tsx"].includes(extension)) {
    return "source-code";
  }

  return "unknown";
}

function calculateConfidence(fileContext: FileContext, path: string, line: string) {
  const baseConfidence: Record<FileContext, number> = {
    "source-code": 0.78,
    configuration: 0.7,
    "dependency-manifest": 0.68,
    documentation: 0.32,
    test: 0.46,
    example: 0.42,
    generated: 0.38,
    unknown: 0.52
  };
  let confidence = baseConfidence[fileContext];
  const normalizedPath = path.toLowerCase();

  if (/(^|\/)(crypto|security|auth|tls|ssl|certs?)(\/|$)/i.test(normalizedPath)) {
    confidence += 0.1;
  }

  if (looksLikeTechnicalUsage(line)) {
    confidence += 0.08;
  }

  if (looksLikeNarrativeText(line)) {
    confidence -= 0.12;
  }

  return Math.max(0.15, Math.min(0.94, Number(confidence.toFixed(2))));
}

function looksLikeTechnicalUsage(line: string) {
  return /[=({[]|const\s|let\s|var\s|function\s|class\s|import\s|require\(|:\s*["'][^"']*(rsa|aes|sha|md5|ecdsa|ecdh)/i.test(line);
}

function looksLikeNarrativeText(line: string) {
  const trimmedLine = line.trim();

  return trimmedLine.length > 80 || /^(#|\/\/|\*|<!--|This |The |Use |Supports? |Algorithm )/i.test(trimmedLine);
}

function getContextSignals(fileContext: FileContext, path: string, line: string) {
  return {
    fileContext,
    securitySensitivePath: /(^|\/)(crypto|security|auth|tls|ssl|certs?)(\/|$)/i.test(path),
    technicalUsage: looksLikeTechnicalUsage(line),
    narrativeText: looksLikeNarrativeText(line)
  };
}

function rule(algorithm: string, category: string, riskLevel: RiskLevel, pattern: RegExp) {
  return {
    algorithm,
    category,
    riskLevel,
    pattern
  };
}

async function report(context: ScannerContext, progress: Parameters<NonNullable<ScannerContext["onProgress"]>>[0]) {
  if (context.signal?.aborted) {
    return;
  }

  await context.onProgress?.(progress);
}

function throwIfAborted(context: ScannerContext) {
  if (context.signal?.aborted) {
    throw new Error("Scan canceled");
  }
}

function calculateAnalysisProgress(filesScanned: number, filesToScan: number) {
  if (filesToScan === 0) {
    return 82;
  }

  return Math.min(82, 35 + Math.round((filesScanned / filesToScan) * 47));
}

function readPositiveInteger(name: string, fallback: number) {
  const value = Number(process.env[name]);

  return Number.isInteger(value) && value > 0 ? value : fallback;
}

function calculateTimedProgress(start: number, end: number, startedAt: number, timeoutMs: number) {
  const elapsedRatio = Math.min((Date.now() - startedAt) / timeoutMs, 1);

  return Math.min(end - 1, start + Math.round((end - start) * elapsedRatio));
}

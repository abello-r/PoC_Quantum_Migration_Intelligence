export const en = {
  app: {
    documentTitle: "QMI | Quantum Migration Intelligence"
  },
  nav: {
    ariaLabel: "Preview menu",
    language: "Language",
    languageAriaLabel: "Language",
    languages: {
      en: "English",
      es: "Spanish"
    },
    theme: "Theme",
    lightTheme: "Light theme",
    darkTheme: "Dark theme",
    signIn: "Sign in"
  },
  hero: {
    eyebrow: "Post-quantum readiness",
    title: "Quantum Migration Intelligence",
    kicker: "Repository-to-roadmap PoC",
    description:
      "A focused PoC that maps cryptographic exposure in repositories and turns it into a practical post-quantum migration roadmap."
  },
  scanForm: {
    ariaLabel: "Repository scan",
    eyebrow: "Repository input",
    title: "Build a migration roadmap",
    repositoryUrl: "GitHub repository URL",
    repositoryPlaceholder: "https://github.com/org/repository",
    runScan: "Analyze repository",
    startingScan: "Analyzing"
  },
  summary: {
    ariaLabel: "Readiness summary",
    eyebrow: "Readiness score",
    description: "A compact score based on detected cryptographic risk and migration readiness.",
    activeEyebrow: "Scan status",
    status: "Status",
    stage: "Stage",
    progress: "Progress",
    findings: "Findings",
    target: "Target",
    repository: "Repository",
    githubSource: "GitHub public metadata",
    githubAvatarAlt: "GitHub repository owner avatar",
    defaultBranch: "Default branch",
    language: "Language",
    visibility: "Visibility",
    size: "Size",
    pushed: "Last push",
    unknownMetadata: "Unknown",
    sizeKb: "{size} KB",
    sizeMb: "{size} MB",
    filesDiscovered: "Discovered",
    filesCandidates: "Candidates",
    filesScanned: "Analyzed",
    filesSkipped: "Skipped",
    elapsedTime: "Elapsed",
    secondsShort: "{seconds}s",
    limitAppliedTitle: "Public scan limit reached",
    limitAppliedDescription: "{count} candidate files were analyzed in public mode. Sign in to unlock the full repository analysis.",
    limitAppliedAction: "Sign in for full scan",
    noScanSelected: "No scan selected",
    waitingForScan: "Run a repository scan to see progress and coverage.",
    noFindingsMatched:
      "Scan completed. No crypto findings matched the current rule set. This does not prove the repository is crypto-free.",
    scanError: "Scan error",
    statuses: {
      idle: "idle",
      starting: "starting",
      pending: "pending",
      running: "running",
      completed: "completed",
      failed: "failed"
    },
    stages: {
      queued: "Queued",
      cloning: "Cloning repository",
      discovering: "Discovering files",
      analyzing: "Analyzing files",
      planning: "Generating roadmap",
      completed: "Completed",
      failed: "Failed"
    },
    messages: {
      scanQueued: "Scan queued",
      cloningRepository: "Cloning repository",
      discoveringFiles: "Discovering files",
      analyzingCandidateFiles: "Analyzing candidate files",
      generatingMigrationPlan: "Generating migration plan",
      scanCompleted: "Scan completed",
      scanCompletedWithoutFindings: "Scan completed. No crypto findings matched the current rule set.",
      scanFailed: "Scan failed"
    }
  },
  risk: {
    ariaLabel: "Risk distribution",
    eyebrow: "Risk distribution",
    title: "Finding mix",
    levels: {
      all: "all",
      critical: "critical",
      vulnerable: "vulnerable",
      partial: "partial",
      hybrid: "hybrid",
      safe: "safe",
      unknown: "unknown"
    }
  },
  migrationPlan: {
    ariaLabel: "Migration plan",
    eyebrow: "Prioritized roadmap",
    title: "Migration plan",
    effortSuffix: "effort",
    emptyTitle: "Migration knowledge base",
    emptyDescription: "When findings appear, this area explains why each algorithm is exposed and what should replace it.",
    emptyCards: {
      algorithm: {
        title: "Algorithm",
        body: "RSA, ECC, AES-128, SHA-1, and other detected primitives are grouped by cryptographic role."
      },
      rationale: {
        title: "Why it matters",
        body: "Each finding is mapped to quantum exposure, deprecated usage, long-term confidentiality, or manual review."
      },
      replacement: {
        title: "Replacement path",
        body: "Recommendations point toward ML-KEM, ML-DSA, SLH-DSA, AES-256, SHA-384+, or hybrid migration."
      }
    }
  },
  findings: {
    ariaLabel: "Scan findings",
    eyebrow: "Normalized findings",
    title: "Crypto assets at risk",
    count: "{filtered} of {total}",
    filtersAriaLabel: "Findings filters",
    search: "Search",
    searchPlaceholder: "Algorithm, category, or path",
    risk: "Risk",
    allRisks: "All risks",
    algorithm: "Algorithm",
    allAlgorithms: "All algorithms",
    context: "Context",
    primaryContexts: "Primary contexts",
    contexts: {
      "source-code": "source code",
      configuration: "configuration",
      "dependency-manifest": "dependency manifest",
      documentation: "documentation",
      test: "test",
      example: "example",
      generated: "generated",
      unknown: "unknown"
    },
    clearFilters: "Clear filters",
    rowsPerPage: "Rows per page",
    pageStatus: "Page {page} of {totalPages}",
    previousPage: "Previous",
    nextPage: "Next",
    category: "Category",
    location: "Location",
    confidence: "Confidence",
    all: "all",
    noFindings: "No findings yet.",
    completedWithoutFindings:
      "Scan completed successfully, but the current rule set did not match cryptographic usage in the analyzed files.",
    noMatches: "No findings match the current filters.",
    unknownLocation: "Unknown location"
  },
  toasts: {
    notifications: "Notifications",
    dismiss: "Dismiss notification",
    scanCompleted: "Scan completed with {count} finding(s).",
    scanFailed: "Scan failed. Review the scan details.",
    refreshFailed: "Could not refresh scan status.",
    scanStarted: "Scan started. Results will update automatically.",
    scanRequestFailed: "Scan request failed. Review the scan details."
  },
  footer: {
    ecosystemIntent: "PoC created with the intent to fit into security ecosystems such as",
    logosLabel: "Google and VirusTotal",
    googleLogoAlt: "Google",
    virustotalLogoAlt: "VirusTotal",
    linkMark: "x",
    inspiredBy: "Inspired by",
    qrammTools: "QRAMM open-source tools"
  }
} as const;

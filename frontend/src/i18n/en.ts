export const en = {
  app: {
    documentTitle: "QMI | Quantum Migration Intelligence"
  },
  nav: {
    ariaLabel: "Preview menu",
    home: "Go to dashboard",
    theme: "Theme",
    lightTheme: "Light theme",
    darkTheme: "Dark theme",
    signIn: "Sign in"
  },
  hero: {
    eyebrow: "Cryptography Exposure",
    eyebrowContinuation: "to Migration Roadmap",
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
    startingScan: "Analyzing",
    scannedAt: "Scanned"
  },
  summary: {
    ariaLabel: "Readiness summary",
    eyebrow: "Readiness score",
    description: "A directional score that combines detected risk, confidence, and remediation readiness into a single migration signal.",
    activeEyebrow: "Scan status",
    status: "Status",
    stage: "Stage",
    progress: "Progress",
    findings: "Findings",
    target: "Target",
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
    progressWithElapsed: "{progress}% · {elapsed}s",
    cancelScan: "Cancel scan",
    cancelingScan: "Canceling",
    limitAppliedTitle: "Public scan limit reached",
    limitAppliedDescription: "{count} candidate files were analyzed in public mode. Sign in to unlock the full repository analysis.",
    limitAppliedAction: "Sign in for full scan",
    noScanSelected: "No scan selected",
    waitingForScan: "Run a repository scan to see progress and coverage.",
    noFindingsMatched:
      "Scan completed. No crypto findings matched the current rule set. This does not prove the repository is crypto-free.",
    scanError: "Scan error",
    requestFailedStage: "Scan request failed",
    requestFailedFallback: "Scan request failed before analysis could start.",
    statuses: {
      idle: "idle",
      starting: "starting",
      pending: "pending",
      running: "running",
      completed: "completed",
      failed: "failed",
      canceled: "canceled"
    },
    stages: {
      queued: "Queued",
      cloning: "Cloning repository",
      discovering: "Discovering files",
      analyzing: "Analyzing files",
      planning: "Generating roadmap",
      completed: "Completed",
      failed: "Failed",
      canceled: "Canceled"
    },
    messages: {
      scanQueued: "Scan queued",
      cloningRepository: "Cloning repository",
      discoveringFiles: "Discovering files",
      analyzingCandidateFiles: "Analyzing candidate files",
      generatingMigrationPlan: "Generating migration plan",
      scanCompleted: "Scan completed",
      scanCompletedWithoutFindings: "Scan completed. No crypto findings matched the current rule set.",
      scanFailed: "Scan failed",
      scanCanceled: "Scan canceled"
    },
    progressDetails: {
      idle: "Waiting for a repository scan.",
      starting: "Creating the scan and preparing repository metadata.",
      requestFailed: "The repository could not be loaded, so no findings or roadmap were generated for this request.",
      cloning: "Cloning the repository. Large repositories can stay here for a bit while Git transfers objects.",
      discovering: "Discovering candidate files and filtering unsupported paths.",
      analyzing: "Analyzing cryptographic evidence. File counts will appear when available.",
      analyzingEstimated: "External analyzer is running. Progress is estimated until tool results are returned.",
      analyzingWithFiles: "Analyzed {scanned} of {candidates} candidate files · skipped {skipped}.",
      planning: "Turning findings into migration tracks and next actions.",
      completed: "Scan completed with {findings} finding(s).",
      failed: "Scan failed. Review the error details below.",
      canceled: "Scan canceled by the user."
    }
  },
  risk: {
    ariaLabel: "Risk exposure",
    eyebrow: "Risk exposure",
    title: "What needs attention",
    emptySummary: "Run a scan to see how findings are distributed by risk.",
    reviewSummary: "{count} of {total} finding(s) need security review before migration planning.",
    clearSummary: "{total} finding(s) were detected, with no critical, vulnerable, partial, or unknown items.",
    tooltipLabel: "Explain risk levels",
    tooltipTitle: "Risk levels",
    tooltip: {
      critical: "Critical: known quantum-vulnerable or deprecated usage that should be prioritized.",
      vulnerable: "Vulnerable: classical cryptography that may not provide long-term protection against quantum attacks.",
      partial: "Partial: acceptable only in specific contexts, usually requiring size, mode, or usage review.",
      hybrid: "Hybrid: combines classical and post-quantum protection during rollout.",
      safe: "Safe: currently aligned with the rule set or recommended target family.",
      unknown: "Unknown: not enough context to classify confidently; manual validation is needed."
    },
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
    openGuideFor: "Open migration guide for {title}",
    pageStatus: "{page} / {totalPages}",
    previousPage: "Previous",
    nextPage: "Next",
    knowledgeBase: {
      title: "Migration knowledge base",
      description: "Open the internal algorithm index for safe targets, deprecated primitives, and rollout guidance."
    },
    emptyTitle: "No migration tracks yet",
    emptyDescription: "When findings appear, this area will show the prioritized remediation tracks generated for this repository.",
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
  migrationGuide: {
    ariaLabel: "Migration guide",
    eyebrow: "Guided remediation",
    back: "Back to dashboard",
    summary: "Guide summary",
    priority: "Priority",
    effort: "Effort",
    findings: "Findings",
    sections: "Guide sections",
    decisionEyebrow: "Decision brief",
    informationTitle: "Information",
    decisionTitle: "What to decide first",
    evidenceTitle: "Evidence",
    issueEyebrow: "Issue",
    issueTitle: "Detected problem",
    algorithms: "Algorithms",
    inspectFirst: "Inspect first",
    noAlgorithmEvidence: "No direct algorithm evidence",
    actionEyebrow: "Execution",
    actionTitle: "Action",
    firstMove: "First move",
    recommendationEyebrow: "Recommended path",
    recommendationTitle: "Recommendation",
    targetTitle: "Target",
    safeTarget: "Safe target",
    algorithmDocs: "Algorithm docs",
    firstFile: "Inspect first",
    highestRisk: "Highest risk",
    actionChecklist: "Action checklist",
    affectedFiles: "Affected files",
    evidenceAffectedFiles: "Evidence / affected files",
    aiStatus: "Coming soon",
    aiTitle: "AI-assisted recommendation",
    aiDescription: "Generate a code-aware replacement plan for this repository.",
    aiPreviewInput: "Replacement target",
    aiAction: "Sign in to generate",
    filesCount: "{count} finding(s)",
    filesTruncated: "Showing {visible} of {total} affected findings.",
    noAffectedFiles: "No directly matched files were available for this guide.",
    loadingTitle: "Loading migration guide",
    loadingDescription: "Fetching the scan and its recommendations.",
    notFoundTitle: "Migration guide not found",
    notFoundDescription: "The selected recommendation could not be found for this scan."
  },
  algorithmDocs: {
    ariaLabel: "Algorithm documentation",
    eyebrow: "Algorithm documentation",
    backToGuide: "Back to remediation",
    backToDashboard: "Back to dashboard",
    indexTitle: "Index",
    overviewTitle: "Algorithm documentation",
    overviewDescription: "A working index for cryptographic primitives, safe replacement families, and migration rollout notes.",
    contentComingTitle: "Documentation not available yet",
    contentComingDescription: "This PoC page is reserved for clear explanations, diagrams, examples, and migration guidance for each algorithm family.",
    placeholder: "This topic is not available yet.",
    mlKem: {
      summary:
        "ML-KEM (Module-Lattice-Based Key-Encapsulation Mechanism), formerly known as CRYSTALS-Kyber, is the NIST-standardized post-quantum KEM for secure key establishment. It is specified in FIPS 203 and its security is related to the computational difficulty of the Module Learning With Errors problem.",
      source: "Source: NIST FIPS 203",
      sourceUrl: "https://csrc.nist.gov/pubs/fips/203/final",
      introNote:
        "ML-KEM does not encrypt application data directly. It establishes a shared secret that protocols can feed into symmetric encryption, authentication, or a key schedule.",
      flowTitle: "How it works",
      flow: {
        keygen: {
          title: "1. Key generation",
          body: "The receiver creates a public encapsulation key and a private decapsulation key."
        },
        encapsulation: {
          title: "2. Encapsulation",
          body: "The sender uses the receiver's public key to create a ciphertext and a fresh shared secret."
        },
        decapsulation: {
          title: "3. Decapsulation",
          body: "The receiver uses the private key to recover the same shared secret from the ciphertext."
        }
      },
      parametersTitle: "Standardized parameter sets",
      parameters: {
        p512: {
          name: "ML-KEM-512",
          level: "NIST security category 1",
          guidance: "Smallest and fastest option; roughly aligned with AES-128 strength."
        },
        p768: {
          name: "ML-KEM-768",
          level: "NIST security category 3",
          guidance: "Balanced default for most applications; roughly aligned with AES-192 strength."
        },
        p1024: {
          name: "ML-KEM-1024",
          level: "NIST security category 5",
          guidance: "Highest standardized ML-KEM strength; roughly aligned with AES-256 strength."
        }
      },
      ecosystemTitle: "Where it is showing up",
      ecosystem:
        "ML-KEM support is already visible in modern cryptographic stacks, including OpenSSL, AWS-LC, and Go's crypto/mlkem package. In protocol work, it is commonly discussed for TLS 1.3 and hybrid key exchange to reduce harvest-now, decrypt-later exposure.",
      ecosystemSources: {
        openssl: "OpenSSL ML-KEM docs",
        opensslUrl: "https://docs.openssl.org/3.5/man7/EVP_KEM-ML-KEM/",
        go: "Go crypto/mlkem docs",
        goUrl: "https://go.dev/pkg/crypto/mlkem/",
        awslc: "AWS-LC PQ notes",
        awslcUrl: "https://github.com/aws/aws-lc/blob/main/crypto/fipsmodule/PQREADME.md"
      },
      sections: {
        what: {
          title: "What it is",
          body: "A KEM lets two parties establish a shared secret over a public channel without sending that secret directly."
        },
        use: {
          title: "Where it fits",
          body: "Use ML-KEM for key establishment and handshake flows, not for signatures, hashing, or direct bulk data encryption."
        },
        migrate: {
          title: "Migration approach",
          body: "Start with protocol and library support, prefer hybrid negotiation during rollout, version payloads and handshakes, and keep rollback explicit and time-boxed."
        },
        review: {
          title: "Review checklist",
          item1: "Confirm the code path performs key establishment, not signing or hashing.",
          item2: "Check whether the protocol already supports ML-KEM or hybrid key exchange.",
          item3: "Track compatibility requirements for clients, servers, certificates, and middleboxes.",
          item4: "Define test vectors, telemetry, and rollback before production rollout."
        }
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
    allCategories: "All categories",
    context: "Context",
    allContexts: "All contexts",
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
    allLocations: "All locations",
    locationFindingCount: "{count} finding(s)",
    confidence: "Confidence",
    allConfidence: "All confidence",
    confidenceLevels: {
      high: "High",
      medium: "Medium",
      low: "Low"
    },
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
    scanRequestFailed: "Scan request failed. Review the scan details.",
    scanCanceled: "Scan canceled.",
    scanCancelFailed: "Could not cancel the scan.",
    signInUnavailable: "Sign in is not available during this PoC."
  },
  footer: {
    ecosystemIntent: "PoC created with the intent to fit into security ecosystems such as",
    logosLabel: "Google and VirusTotal",
    googleLogoAlt: "Google",
    virustotalLogoAlt: "VirusTotal",
    linkMark: "x"
  }
} as const;

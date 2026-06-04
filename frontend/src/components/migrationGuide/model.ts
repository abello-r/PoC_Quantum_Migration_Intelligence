import { t } from "../../i18n";
import type { Finding, MigrationRecommendation } from "../../lib/api";
import { formatFindingLocation } from "../../lib/findingPaths";

export type GuideKind = "key-establishment" | "signature" | "asymmetric" | "symmetric" | "deprecated" | "unknown";

export type TransitionPath = {
  target: string;
  body: string;
  items: string[];
};

const riskPriority: Record<Finding["riskLevel"], number> = {
  critical: 0,
  vulnerable: 1,
  partial: 2,
  hybrid: 3,
  unknown: 4,
  safe: 5
};

export function getGuideKind(recommendation: MigrationRecommendation): GuideKind {
  const title = recommendation.title.toLowerCase();

  if (title.includes("key establishment")) {
    return "key-establishment";
  }

  if (title.includes("signature") || title.includes("certificate")) {
    return "signature";
  }

  if (title.includes("symmetric") || title.includes("confidentiality")) {
    return "symmetric";
  }

  if (title.includes("deprecated")) {
    return "deprecated";
  }

  if (title.includes("unknown") || title.includes("low-confidence") || title.includes("ambiguous") || title.includes("validate")) {
    return "unknown";
  }

  return "asymmetric";
}

export function getAffectedFindings(findings: Finding[], kind: GuideKind) {
  const matchers: Record<GuideKind, string[]> = {
    "key-establishment": ["rsa", "dh", "ecdh"],
    signature: ["rsa", "ecdsa", "dsa", "ed25519"],
    asymmetric: ["rsa", "ecdsa", "dsa", "dh", "ecdh", "ed25519"],
    symmetric: ["aes", "sha", "hmac"],
    deprecated: ["md5", "sha-1", "3des", "rc4", "des"],
    unknown: []
  };

  if (kind === "unknown") {
    return findings.filter((finding) => finding.riskLevel === "unknown" || finding.confidence < 0.7);
  }

  return findings.filter((finding) => matchesGuideKind(finding, kind, matchers[kind])).sort(compareFindings);
}

function matchesGuideKind(finding: Finding, kind: GuideKind, algorithmMatchers: string[]) {
  const algorithm = finding.algorithm.toLowerCase();
  const category = finding.category.toLowerCase();

  if (algorithmMatchers.some((matcher) => algorithm.includes(matcher))) {
    return true;
  }

  if (kind === "symmetric") {
    return (
      finding.riskLevel === "partial" ||
      finding.riskLevel === "hybrid" ||
      includesAny(category, ["symmetric", "encryption", "hash", "integrity", "message-authentication"])
    );
  }

  if (kind === "key-establishment") {
    return includesAny(category, ["key-exchange", "key-establishment", "key-transport", "key-wrapping", "tls"]);
  }

  if (kind === "signature" || kind === "asymmetric") {
    return includesAny(category, ["signature", "certificate", "identity", "signing"]);
  }

  if (kind === "deprecated") {
    return includesAny(category, ["deprecated", "legacy"]);
  }

  return false;
}

function includesAny(value: string, candidates: string[]) {
  return candidates.some((candidate) => value.includes(candidate));
}

function compareFindings(left: Finding, right: Finding) {
  return riskPriority[left.riskLevel] - riskPriority[right.riskLevel] || right.confidence - left.confidence;
}

export function getActionItems(actionText: string) {
  return actionText
    .split("\n")
    .map((action) => action.replace(/^\d+\.\s*/, "").trim())
    .filter(Boolean);
}

export function getDecisionText(kind: GuideKind) {
  const decisions: Record<GuideKind, string> = {
    "key-establishment":
      "Decide whether this flow protects long-lived confidential data and whether both endpoints can support a hybrid post-quantum rollout.",
    signature:
      "Decide which producers and verifiers must move together before replacing signatures or certificate chains.",
    asymmetric:
      "Split the findings by role first: key establishment, signatures, identity, certificates, or compatibility-only usage.",
    symmetric:
      "Decide whether the protected data has a long enough lifetime to require stronger symmetric parameters.",
    deprecated:
      "Decide whether each legacy primitive is active protection, historical verification, or non-production evidence.",
    unknown:
      "Validate whether this is real production cryptography before assigning migration work."
  };

  return decisions[kind];
}

export function getTransitionPath(kind: GuideKind): TransitionPath {
  const paths: Record<GuideKind, TransitionPath> = {
    "key-establishment": {
      target: "ML-KEM",
      body: "Use ML-KEM for KEM-based key establishment where the protocol stack supports it. Prefer hybrid negotiation during rollout so classical and post-quantum protection can coexist.",
      items: ["Confirm library/protocol support.", "Version payloads or handshakes before rollout.", "Keep rollback explicit and time-boxed."]
    },
    signature: {
      target: "ML-DSA / SLH-DSA",
      body: "Use ML-DSA for general-purpose signatures. Consider SLH-DSA when conservative hash-based signatures are preferred and larger signatures are acceptable.",
      items: ["Inventory producers and verifiers.", "Test old, new, and dual-signed artifacts.", "Check size limits in tokens, certificates, and release tooling."]
    },
    asymmetric: {
      target: "ML-KEM + ML-DSA",
      body: "Use ML-KEM for key establishment and ML-DSA or SLH-DSA for signatures. Do not swap algorithm names until the cryptographic role is confirmed.",
      items: ["Classify each finding by runtime role.", "Separate encryption from trust verification.", "Plan hybrid deployment where interoperability matters."]
    },
    symmetric: {
      target: "AES-256 / SHA-384+",
      body: "Strengthen long-lived confidentiality and integrity controls. Symmetric migration is usually a parameter and key-management change, not a full protocol replacement.",
      items: ["Check data lifetime.", "Confirm key rotation support.", "Version stored ciphertexts or digest formats before changing parameters."]
    },
    deprecated: {
      target: "Replacement depends on usage",
      body: "Deprecated primitives need usage-specific remediation. Passwords, signatures, integrity checks, and encryption should not all receive the same replacement.",
      items: ["Replace password storage with dedicated password hashing.", "Use modern hashes or HMAC for integrity.", "Use authenticated encryption for encryption flows."]
    },
    unknown: {
      target: "Validate before replacing",
      body: "Do not choose a replacement until production usage is confirmed. Close false positives explicitly so the roadmap stays focused.",
      items: ["Confirm runtime reachability.", "Identify owner and purpose.", "Promote confirmed usage into the matching migration track."]
    }
  };

  return paths[kind];
}

export function getTopAlgorithms(findings: Finding[]) {
  const counts = findings.reduce<Record<string, number>>((summary, finding) => {
    summary[finding.algorithm] = (summary[finding.algorithm] ?? 0) + 1;
    return summary;
  }, {});

  return Object.entries(counts)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 3)
    .map(([algorithm, count]) => `${algorithm} (${count})`);
}

export function getPrimaryLocation(findings: Finding[]) {
  const finding = findings[0];

  if (!finding) {
    return t("findings.unknownLocation");
  }

  return formatFindingLocation(finding, t("findings.unknownLocation"));
}

export function getHighestRiskLabel(findings: Finding[]) {
  const highestRisk = findings.reduce<Finding["riskLevel"]>(
    (risk, finding) => (riskPriority[finding.riskLevel] < riskPriority[risk] ? finding.riskLevel : risk),
    findings[0]?.riskLevel ?? "unknown"
  );

  return t(`risk.levels.${highestRisk}`);
}

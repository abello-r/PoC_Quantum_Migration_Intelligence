import type { Effort, FileContext, MigrationRecommendationDraft, NormalizedFinding, RiskLevel } from "../types/domain.js";

type FindingTrack = "key-establishment" | "signature" | "symmetric-hardening" | "deprecated-remediation" | "manual-validation";

type TrackDefinition = {
  id: FindingTrack;
  priority: number;
  title: string;
  match: (finding: NormalizedFinding) => boolean;
  transitionGoal: string;
  primaryQuestion: string;
  replacementPath: string;
  validationQuestions: string[];
};

type TrackInsight = {
  definition: TrackDefinition;
  findings: NormalizedFinding[];
  productionFindings: NormalizedFinding[];
  highRiskFindings: NormalizedFinding[];
  lowConfidenceFindings: NormalizedFinding[];
  topAlgorithms: string[];
  topLocations: string[];
  contexts: Partial<Record<FileContext, number>>;
  effort: Effort;
};

const productionContexts = new Set<FileContext>(["source-code", "configuration", "dependency-manifest", "unknown"]);
const riskPriority: Record<RiskLevel, number> = {
  critical: 0,
  vulnerable: 1,
  partial: 2,
  hybrid: 3,
  unknown: 4,
  safe: 5
};

const trackDefinitions: TrackDefinition[] = [
  {
    id: "key-establishment",
    priority: 1,
    title: "Secure key establishment and encrypted data flows",
    match: (finding) =>
      includesAny(finding.algorithm, ["ecdh", "ecdhe", "diffie", "dhe", "dh"]) ||
      includesAny(finding.category, ["key-exchange", "key-establishment", "key-transport", "key-wrapping", "tls"]),
    transitionGoal: "protect traffic and encrypted data that may need confidentiality beyond the lifetime of current classical algorithms",
    primaryQuestion: "Does this usage protect long-lived confidential data, service-to-service traffic, stored secrets, or external client sessions?",
    replacementPath:
      "Plan ML-KEM adoption where the protocol supports KEM-based key establishment. Use hybrid classical plus post-quantum negotiation during rollout when both endpoints cannot move at once.",
    validationQuestions: [
      "Which systems control each endpoint of the exchange?",
      "Can the protocol or library negotiate hybrid/post-quantum modes today?",
      "Are ciphertext, key, or handshake sizes assumed anywhere in code or storage?"
    ]
  },
  {
    id: "signature",
    priority: 2,
    title: "Migrate signatures, certificates, and trust verification",
    match: (finding) =>
      includesAny(finding.algorithm, ["rsa", "ecdsa", "dsa", "ed25519", "ed448"]) ||
      includesAny(finding.category, ["signature", "certificate", "identity", "signing"]),
    transitionGoal: "preserve trust while producers, verifiers, clients, partners, and build systems move at different speeds",
    primaryQuestion: "Is this finding producing signatures, verifying signatures, issuing certificates, validating identities, or signing artifacts?",
    replacementPath:
      "Use ML-DSA for general-purpose signatures and SLH-DSA when a conservative hash-based signature is preferred. Use dual-signing or parallel verification during migration.",
    validationQuestions: [
      "Who produces the signature and who verifies it?",
      "Do any clients, partners, CI systems, or devices reject larger signatures or new certificate chains?",
      "Can old, new, and transition artifacts be tested side by side?"
    ]
  },
  {
    id: "symmetric-hardening",
    priority: 3,
    title: "Harden symmetric encryption and integrity controls",
    match: (finding) =>
      includesAny(finding.algorithm, ["aes-128", "sha-256", "hmac-sha256"]) ||
      (includesAny(finding.category, ["symmetric", "hash", "message-authentication"]) && finding.riskLevel !== "safe"),
    transitionGoal: "raise security margins for data or evidence that must remain confidential or trustworthy for a long time",
    primaryQuestion: "What is the confidentiality or integrity lifetime of the data protected by this usage?",
    replacementPath:
      "Prefer AES-256 for long-lived confidentiality and SHA-384/SHA-512 family hashes for new long-term integrity workflows. Keep HMAC when appropriate, but validate key length and rotation.",
    validationQuestions: [
      "Does changing parameters require re-encrypting stored data or versioning payloads?",
      "Are digest lengths, key lengths, IV sizes, or algorithm names hardcoded?",
      "Does key management already support the target parameters?"
    ]
  },
  {
    id: "deprecated-remediation",
    priority: 4,
    title: "Remove deprecated cryptographic primitives",
    match: (finding) =>
      includesAny(finding.algorithm, ["md5", "sha-1", "sha1", "3des", "des", "rc4"]) ||
      includesAny(finding.category, ["deprecated", "legacy"]),
    transitionGoal: "eliminate algorithms that are already weak before considering post-quantum migration",
    primaryQuestion: "Is the primitive actively protecting production data, used only for compatibility, or present in tests/documentation?",
    replacementPath:
      "Replace by usage: password storage needs dedicated password hashing, integrity checks need modern hashes or HMAC, and encryption should move to authenticated encryption such as AES-GCM or ChaCha20-Poly1305 where appropriate.",
    validationQuestions: [
      "Is this externally reachable or only historical verification?",
      "Are there stored artifacts that still need verification-only support?",
      "Can new usage be blocked with tests, linting, or scanner rules after remediation?"
    ]
  },
  {
    id: "manual-validation",
    priority: 5,
    title: "Validate ambiguous or low-confidence evidence",
    match: (finding) =>
      finding.riskLevel === "unknown" ||
      finding.confidence < 0.7 ||
      ["documentation", "test", "example", "generated"].includes(finding.fileContext),
    transitionGoal: "keep the roadmap focused on real production migration work instead of noise",
    primaryQuestion: "Is this evidence production behavior, configuration, dependency metadata, documentation, a test fixture, or generated output?",
    replacementPath:
      "Do not choose a replacement until usage is confirmed. Promote confirmed findings into the matching migration track; close false positives with evidence.",
    validationQuestions: [
      "Can the line be reached by production runtime or deployment?",
      "Is it an algorithm selection, a dependency declaration, a comment, or sample text?",
      "Who can confirm ownership and intended use?"
    ]
  }
];

export function generateMigrationPlan(findings: NormalizedFinding[]): MigrationRecommendationDraft[] {
  return trackDefinitions
    .map((definition) => buildTrackInsight(definition, findings))
    .filter((insight) => insight.findings.length > 0)
    .sort(compareTrackInsights)
    .map((insight, index) => toRecommendation(insight, index + 1));
}

function buildTrackInsight(definition: TrackDefinition, findings: NormalizedFinding[]): TrackInsight {
  const trackFindings = findings.filter(definition.match).sort(compareFindingPriority);
  const productionFindings = trackFindings.filter((finding) => productionContexts.has(finding.fileContext));
  const highRiskFindings = trackFindings.filter((finding) => ["critical", "vulnerable"].includes(finding.riskLevel));
  const lowConfidenceFindings = trackFindings.filter((finding) => finding.confidence < 0.7);

  return {
    definition,
    findings: trackFindings,
    productionFindings,
    highRiskFindings,
    lowConfidenceFindings,
    topAlgorithms: topValues(trackFindings.map((finding) => finding.algorithm), 4),
    topLocations: formatLocations(trackFindings),
    contexts: countBy(trackFindings.map((finding) => finding.fileContext)),
    effort: estimateEffort(trackFindings, productionFindings, highRiskFindings)
  };
}

function toRecommendation(insight: TrackInsight, priority: number): MigrationRecommendationDraft {
  return {
    priority,
    title: insight.definition.title,
    rationale: buildRationale(insight),
    recommendedAction: formatActionList(buildActions(insight)),
    effort: insight.effort
  };
}

function buildRationale(insight: TrackInsight) {
  const parts = [
    `${insight.findings.length} finding(s) map to this migration track.`,
    insight.topAlgorithms.length > 0 ? `Most visible algorithms: ${insight.topAlgorithms.join(", ")}.` : null,
    insight.productionFindings.length > 0
      ? `${insight.productionFindings.length} finding(s) are in source, configuration, dependency metadata, or unknown context and should be triaged first.`
      : "Current evidence is mostly tests, examples, documentation, or generated files; validate before assigning implementation work.",
    insight.highRiskFindings.length > 0 ? `${insight.highRiskFindings.length} finding(s) are critical or vulnerable.` : null,
    `Goal: ${insight.definition.transitionGoal}.`
  ].filter(Boolean);

  return parts.join(" ");
}

function buildActions(insight: TrackInsight) {
  const actions = [
    `Answer first: ${insight.definition.primaryQuestion}`,
    `Inspect first: ${insight.topLocations.length > 0 ? insight.topLocations.join(", ") : "the highest-confidence production findings"}.`,
    `Choose transition path: ${insight.definition.replacementPath}`,
    `Resolve open questions: ${insight.definition.validationQuestions.join(" ")}`,
    buildAcceptanceCriteria(insight)
  ];

  if (insight.lowConfidenceFindings.length > 0 && insight.definition.id !== "manual-validation") {
    actions.splice(
      2,
      0,
      `${insight.lowConfidenceFindings.length} finding(s) are low-confidence; confirm real usage before scheduling implementation.`
    );
  }

  return actions;
}

function buildAcceptanceCriteria(insight: TrackInsight) {
  const contextSummary = formatContextSummary(insight.contexts);

  return `Acceptance criteria: every ${insight.definition.id.replace(/-/g, " ")} finding has an owner, confirmed runtime context, target replacement or closure reason, compatibility test plan, and rollout stage. ${contextSummary}`;
}

function estimateEffort(findings: NormalizedFinding[], productionFindings: NormalizedFinding[], highRiskFindings: NormalizedFinding[]): Effort {
  if (findings.length >= 10 || productionFindings.length >= 5 || highRiskFindings.length >= 3) {
    return "high";
  }

  if (findings.length >= 3 || productionFindings.length >= 2 || highRiskFindings.length > 0) {
    return "medium";
  }

  return "low";
}

function compareTrackInsights(left: TrackInsight, right: TrackInsight) {
  const priorityDifference = left.definition.priority - right.definition.priority;

  if (priorityDifference !== 0) {
    return priorityDifference;
  }

  return right.highRiskFindings.length - left.highRiskFindings.length || right.productionFindings.length - left.productionFindings.length;
}

function compareFindingPriority(left: NormalizedFinding, right: NormalizedFinding) {
  return (
    getContextPriority(left.fileContext) - getContextPriority(right.fileContext) ||
    riskPriority[left.riskLevel] - riskPriority[right.riskLevel] ||
    right.confidence - left.confidence
  );
}

function getContextPriority(context: FileContext) {
  switch (context) {
    case "source-code":
      return 0;
    case "configuration":
      return 1;
    case "dependency-manifest":
      return 2;
    case "unknown":
      return 3;
    case "test":
      return 4;
    case "example":
      return 5;
    case "generated":
      return 6;
    case "documentation":
      return 7;
  }
}

function formatLocations(findings: NormalizedFinding[]) {
  return Array.from(
    new Set(
      findings
        .filter((finding) => finding.filePath)
        .map((finding) => `${finding.filePath}${finding.line ? `:${finding.line}` : ""}`)
    )
  ).slice(0, 4);
}

function formatContextSummary(contexts: Partial<Record<FileContext, number>>) {
  const summary = Object.entries(contexts)
    .filter(([, count]) => count > 0)
    .map(([context, count]) => `${count} ${context}`)
    .join(", ");

  return summary ? `Current scope by context: ${summary}.` : "";
}

function formatActionList(actions: string[]) {
  return actions.map((action, index) => `${index + 1}. ${action}`).join("\n");
}

function includesAny(value: string, terms: string[]) {
  const normalizedValue = value.toLowerCase();

  return terms.some((term) => normalizedValue.includes(term.toLowerCase()));
}

function topValues(values: string[], limit: number) {
  const counts = countBy(values.map((value) => value.trim()).filter(Boolean));

  return Object.entries(counts)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, limit)
    .map(([value, count]) => `${value} (${count})`);
}

function countBy<T extends string>(values: T[]) {
  return values.reduce<Record<T, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {} as Record<T, number>);
}

import type { MigrationRecommendationDraft, NormalizedFinding } from "../types/domain.js";

export function generateMigrationPlan(findings: NormalizedFinding[]): MigrationRecommendationDraft[] {
  const criticalFindings = filterByAlgorithms(findings, ["RSA", "ECDSA", "DH", "ECDH", "Ed25519"]);
  const symmetricFindings = filterByAlgorithms(findings, ["AES-128", "SHA-256", "HMAC-SHA256"]);
  const deprecatedFindings = filterByAlgorithms(findings, ["MD5", "SHA-1", "3DES", "RC4"]);
  const unknownFindings = findings.filter((finding) => finding.riskLevel === "unknown" || finding.confidence < 0.7);
  const recommendations: MigrationRecommendationDraft[] = [];

  if (criticalFindings.length > 0) {
    recommendations.push({
      priority: 1,
      title: "Replace quantum-vulnerable asymmetric cryptography",
      rationale: `${criticalFindings.length} finding(s) rely on asymmetric algorithms that are exposed to large-scale quantum attacks.`,
      recommendedAction: "Plan migration toward ML-KEM for key establishment and ML-DSA or SLH-DSA for signatures. Use hybrid schemes while platform support matures.",
      effort: "high"
    });
  }

  if (symmetricFindings.length > 0) {
    recommendations.push({
      priority: 2,
      title: "Harden long-term confidentiality controls",
      rationale: `${symmetricFindings.length} finding(s) use algorithms that may need stronger parameters for long-lived sensitive data.`,
      recommendedAction: "Prefer AES-256 and SHA-384 or stronger hash constructions for long-term confidentiality and audit evidence.",
      effort: "medium"
    });
  }

  if (deprecatedFindings.length > 0) {
    recommendations.push({
      priority: 3,
      title: "Remove deprecated cryptographic primitives",
      rationale: `${deprecatedFindings.length} finding(s) use legacy algorithms that are already weak before considering quantum risk.`,
      recommendedAction: "Replace deprecated primitives with modern approved algorithms before PQC migration work begins.",
      effort: "medium"
    });
  }

  if (unknownFindings.length > 0) {
    recommendations.push({
      priority: 4,
      title: "Review low-confidence or unknown findings",
      rationale: `${unknownFindings.length} finding(s) need manual validation before they can be assigned to a migration track.`,
      recommendedAction: "Assign an owner to validate usage context, key lifetime, data sensitivity, and runtime reachability.",
      effort: "low"
    });
  }

  return recommendations.sort((a, b) => a.priority - b.priority);
}

function filterByAlgorithms(findings: NormalizedFinding[], algorithms: string[]) {
  return findings.filter((finding) => {
    const normalized = finding.algorithm.toLowerCase();

    return algorithms.some((algorithm) => normalized.includes(algorithm.toLowerCase()));
  });
}

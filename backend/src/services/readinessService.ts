import { riskLevels, type RiskLevel } from "../types/domain.js";

type ReadinessFinding = {
  riskLevel: string;
};

const riskWeights: Record<RiskLevel, number> = {
  safe: 1,
  hybrid: 0.8,
  partial: 0.3,
  unknown: 0.1,
  vulnerable: 0,
  critical: 0
};

export function calculateReadinessScore(findings: ReadinessFinding[]): number {
  if (findings.length === 0) {
    return 100;
  }

  const readinessPoints = findings.reduce((sum, finding) => {
    const riskLevel = parseRiskLevel(finding.riskLevel);

    return sum + riskWeights[riskLevel];
  }, 0);

  return Math.max(0, Math.min(100, Math.round((readinessPoints / findings.length) * 100)));
}

export function summarizeRisks(findings: Array<{ riskLevel: string }>) {
  return findings.reduce<Record<RiskLevel, number>>(
    (summary, finding) => {
      const riskLevel = parseRiskLevel(finding.riskLevel);
      summary[riskLevel] += 1;
      return summary;
    },
    {
      critical: 0,
      vulnerable: 0,
      partial: 0,
      hybrid: 0,
      safe: 0,
      unknown: 0
    }
  );
}

function parseRiskLevel(value: string): RiskLevel {
  return riskLevels.includes(value as RiskLevel) ? (value as RiskLevel) : "unknown";
}

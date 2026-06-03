import { riskLevels, type FileContext, type RiskLevel } from "../types/domain.js";

type ReadinessFinding = {
  riskLevel: string;
  confidence?: number;
  fileContext?: string;
};

const riskPenalties: Record<RiskLevel, number> = {
  critical: 26,
  vulnerable: 18,
  partial: 10,
  hybrid: 6,
  safe: 0,
  unknown: 8
};

const contextMultipliers: Record<FileContext, number> = {
  "source-code": 1,
  configuration: 0.9,
  "dependency-manifest": 0.85,
  unknown: 0.7,
  test: 0.45,
  example: 0.4,
  documentation: 0.35,
  generated: 0.3
};

export function calculateReadinessScore(findings: ReadinessFinding[]): number {
  if (findings.length === 0) {
    return 100;
  }

  const totalPenalty = findings.reduce((sum, finding) => {
    const riskLevel = parseRiskLevel(finding.riskLevel);
    const confidence = typeof finding.confidence === "number" ? finding.confidence : 0.6;
    const contextMultiplier = getContextMultiplier(finding.fileContext);

    return sum + riskPenalties[riskLevel] * confidence * contextMultiplier;
  }, 0);
  const dampenedPenalty = 100 * (1 - Math.exp(-totalPenalty / 85));

  return Math.max(0, Math.round(100 - dampenedPenalty));
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

function getContextMultiplier(value: string | undefined) {
  if (value && value in contextMultipliers) {
    return contextMultipliers[value as FileContext];
  }

  return contextMultipliers.unknown;
}

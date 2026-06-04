import type { Translate } from "../i18n";
import type { FileContext, Finding } from "../lib/api";
import { buildGitHubLocationUrl, getRepositoryFilePath } from "../lib/findingPaths";

export const riskOptions = ["all", "critical", "vulnerable", "partial", "hybrid", "safe", "unknown"] as const;
export const contextOptions = ["primary", "all", "source-code", "configuration", "dependency-manifest", "documentation", "test", "example", "generated", "unknown"] as const;
export const confidenceOptions = ["all", "high", "medium", "low"] as const;
export const pageSizeOptions = [10, 25, 50] as const;

export type RiskFilter = (typeof riskOptions)[number];
export type ContextFilter = (typeof contextOptions)[number];
export type ConfidenceFilter = (typeof confidenceOptions)[number];

export type FindingsFilters = {
  query: string;
  riskLevel: RiskFilter;
  algorithm: string;
  category: string;
  fileContext: ContextFilter;
  location: string;
  confidence: ConfidenceFilter;
};

export type FindingLocationGroup = {
  key: string;
  label: string;
  href: string | null;
  highestRisk: Finding["riskLevel"];
  findings: Finding[];
};

export const initialFilters: FindingsFilters = {
  query: "",
  riskLevel: "all",
  algorithm: "all",
  category: "all",
  fileContext: "all",
  location: "all",
  confidence: "all"
};

const primaryContexts = new Set<FileContext>(["source-code", "configuration", "dependency-manifest", "unknown"]);
const riskPriority: Record<Finding["riskLevel"], number> = {
  critical: 0,
  vulnerable: 1,
  partial: 2,
  hybrid: 3,
  unknown: 4,
  safe: 5
};

export function getAlgorithms(findings: Finding[]) {
  return getUniqueValues(findings.map((finding) => finding.algorithm));
}

export function getUniqueValues(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

export function sortOptionsByLabel<T extends string>(options: { label: string; value: T }[]) {
  return [...options].sort((left, right) => left.label.localeCompare(right.label));
}

export function getLocations(findings: Finding[]) {
  return getUniqueValues(findings.map((finding) => getRepositoryFilePath(finding.filePath) ?? "__unknown"));
}

export function areFiltersActive(filters: FindingsFilters) {
  return (
    filters.query.trim().length > 0 ||
    filters.riskLevel !== "all" ||
    filters.algorithm !== "all" ||
    filters.category !== "all" ||
    filters.fileContext !== "all" ||
    filters.location !== "all" ||
    filters.confidence !== "all"
  );
}

export function filterFindings(findings: Finding[], filters: FindingsFilters) {
  const normalizedQuery = filters.query.trim().toLowerCase();

  return findings
    .filter((finding) => {
      const matchesRisk = filters.riskLevel === "all" || finding.riskLevel === filters.riskLevel;
      const matchesAlgorithm = filters.algorithm === "all" || finding.algorithm === filters.algorithm;
      const matchesCategory = filters.category === "all" || finding.category === filters.category;
      const matchesContext =
        filters.fileContext === "all" ||
        (filters.fileContext === "primary" ? primaryContexts.has(finding.fileContext) : finding.fileContext === filters.fileContext);
      const filePath = getRepositoryFilePath(finding.filePath);
      const matchesLocation =
        filters.location === "all" || (filters.location === "__unknown" ? !filePath : filePath === filters.location);
      const matchesConfidence = filters.confidence === "all" || getConfidenceRange(finding.confidence) === filters.confidence;
      const searchableText = `${finding.algorithm} ${finding.category} ${finding.fileContext} ${filePath ?? ""}`.toLowerCase();
      const matchesQuery = normalizedQuery.length === 0 || searchableText.includes(normalizedQuery);

      return matchesRisk && matchesAlgorithm && matchesCategory && matchesContext && matchesLocation && matchesConfidence && matchesQuery;
    })
    .sort((left, right) => {
      const riskSort = riskPriority[left.riskLevel] - riskPriority[right.riskLevel];

      if (riskSort !== 0) {
        return riskSort;
      }

      const algorithmSort = left.algorithm.localeCompare(right.algorithm);

      if (algorithmSort !== 0) {
        return algorithmSort;
      }

      const categorySort = left.category.localeCompare(right.category);

      if (categorySort !== 0) {
        return categorySort;
      }

      return left.fileContext.localeCompare(right.fileContext);
    });
}

export function groupFindingsByLocation(
  findings: Finding[],
  repositoryUrl: string | null,
  defaultBranch: string | null,
  unknownLocation: string
): FindingLocationGroup[] {
  const groups = new Map<string, Finding[]>();

  findings.forEach((finding) => {
    const key = getRepositoryFilePath(finding.filePath) ?? "__unknown";
    groups.set(key, [...(groups.get(key) ?? []), finding]);
  });

  return Array.from(groups.entries())
    .map(([key, groupFindings]) => {
      const sortedFindings = groupFindings.sort(compareFindings);
      const representative = sortedFindings[0];

      return {
        key,
        label: key === "__unknown" ? unknownLocation : key,
        href: representative ? buildGitHubLocationUrl(repositoryUrl, defaultBranch, { ...representative, line: null }) : null,
        highestRisk: sortedFindings.reduce<Finding["riskLevel"]>(
          (highestRisk, finding) => (riskPriority[finding.riskLevel] < riskPriority[highestRisk] ? finding.riskLevel : highestRisk),
          sortedFindings[0]?.riskLevel ?? "unknown"
        ),
        findings: sortedFindings
      };
    })
    .sort((left, right) => {
      const riskSort = riskPriority[left.highestRisk] - riskPriority[right.highestRisk];

      if (riskSort !== 0) {
        return riskSort;
      }

      return left.label.localeCompare(right.label);
    });
}

export function getAverageConfidence(findings: Finding[]) {
  if (findings.length === 0) {
    return 0;
  }

  return findings.reduce((sum, finding) => sum + finding.confidence, 0) / findings.length;
}

export function getContextOptionLabel(option: (typeof contextOptions)[number], t: Translate) {
  if (option === "primary") {
    return t("findings.primaryContexts");
  }

  if (option === "all") {
    return t("findings.allContexts");
  }

  return getContextLabel(option, t);
}

export function getContextLabel(context: FileContext, t: Translate) {
  return capitalizeFirst(t(`findings.contexts.${context}`));
}

export function getConfidenceOptionLabel(option: (typeof confidenceOptions)[number], t: Translate) {
  if (option === "all") {
    return t("findings.allConfidence");
  }

  return t(`findings.confidenceLevels.${option}`);
}

function compareFindings(left: Finding, right: Finding) {
  const riskSort = riskPriority[left.riskLevel] - riskPriority[right.riskLevel];

  if (riskSort !== 0) {
    return riskSort;
  }

  return (left.line ?? Number.MAX_SAFE_INTEGER) - (right.line ?? Number.MAX_SAFE_INTEGER) || left.algorithm.localeCompare(right.algorithm);
}

function getConfidenceRange(confidence: number): Exclude<(typeof confidenceOptions)[number], "all"> {
  if (confidence >= 0.8) {
    return "high";
  }

  if (confidence >= 0.5) {
    return "medium";
  }

  return "low";
}

function capitalizeFirst(value: string) {
  return value.length > 0 ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : value;
}

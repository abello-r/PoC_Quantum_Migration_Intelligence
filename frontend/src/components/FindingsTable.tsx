import { useEffect, useMemo, useState } from "react";
import { useI18n } from "../i18n";
import type { FileContext, Finding } from "../lib/api";

const riskOptions = ["all", "critical", "vulnerable", "partial", "hybrid", "safe", "unknown"] as const;
const contextOptions = ["primary", "all", "source-code", "configuration", "dependency-manifest", "documentation", "test", "example", "generated", "unknown"] as const;
const pageSizeOptions = [10, 25, 50] as const;
const primaryContexts = new Set<FileContext>(["source-code", "configuration", "dependency-manifest", "unknown"]);
const riskPriority: Record<Finding["riskLevel"], number> = {
  critical: 0,
  vulnerable: 1,
  partial: 2,
  hybrid: 3,
  unknown: 4,
  safe: 5
};

type FindingsTableProps = {
  findings: Finding[];
  repositoryUrl: string | null;
  defaultBranch: string | null;
  isScanCompleted: boolean;
};

export function FindingsTable({ findings, repositoryUrl, defaultBranch, isScanCompleted }: FindingsTableProps) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [riskLevel, setRiskLevel] = useState<(typeof riskOptions)[number]>("all");
  const [algorithm, setAlgorithm] = useState("all");
  const [fileContext, setFileContext] = useState<(typeof contextOptions)[number]>("all");
  const [pageSize, setPageSize] = useState<(typeof pageSizeOptions)[number]>(25);
  const [page, setPage] = useState(1);
  const algorithms = useMemo(() => getAlgorithms(findings), [findings]);
  const filteredFindings = useMemo(
    () => filterFindings(findings, query, riskLevel, algorithm, fileContext),
    [findings, query, riskLevel, algorithm, fileContext]
  );
  const totalPages = Math.max(1, Math.ceil(filteredFindings.length / pageSize));
  const paginatedFindings = filteredFindings.slice((page - 1) * pageSize, page * pageSize);
  const hasActiveFilters = query.trim().length > 0 || riskLevel !== "all" || algorithm !== "all" || fileContext !== "all";

  useEffect(() => {
    setPage(1);
  }, [query, riskLevel, algorithm, fileContext, pageSize]);

  useEffect(() => {
    setPage((currentPage) => Math.min(currentPage, totalPages));
  }, [totalPages]);

  return (
    <section className="panel table-panel" aria-label={t("findings.ariaLabel")}>
      <div className="panel-heading findings-heading">
        <div>
          <p className="eyebrow">{t("findings.eyebrow")}</p>
          <h2>{t("findings.title")}</h2>
        </div>
        <span>{t("findings.count", { filtered: filteredFindings.length, total: findings.length })}</span>
      </div>
      <div className="filters" aria-label={t("findings.filtersAriaLabel")}>
        <div className="filter-row">
          <label className="search-filter">
            <span>{t("findings.search")}</span>
            <input
              type="search"
              placeholder={t("findings.searchPlaceholder")}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <label className="algorithm-filter">
            <span>{t("findings.algorithm")}</span>
            <select value={algorithm} onChange={(event) => setAlgorithm(event.target.value)}>
              <option value="all">{t("findings.allAlgorithms")}</option>
              {algorithms.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="context-filter">
            <span>{t("findings.context")}</span>
            <select value={fileContext} onChange={(event) => setFileContext(event.target.value as (typeof contextOptions)[number])}>
              {contextOptions.map((option) => (
                <option key={option} value={option}>
                  {getContextOptionLabel(option, t)}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="clear-filters"
            disabled={!hasActiveFilters}
            onClick={() => {
              setQuery("");
              setRiskLevel("all");
              setAlgorithm("all");
              setFileContext("all");
            }}
          >
            {t("findings.clearFilters")}
          </button>
        </div>
        <div className="risk-filter-group" aria-label={t("findings.risk")}>
          {riskOptions.map((option) => (
            <button
              key={option}
              type="button"
              className={`risk-filter-button ${riskLevel === option ? "active" : ""}`}
              aria-pressed={riskLevel === option}
              onClick={() => setRiskLevel(option)}
            >
              {option === "all" ? t("findings.allRisks") : t(`risk.levels.${option}`)}
            </button>
          ))}
        </div>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>{t("findings.risk")}</th>
              <th>{t("findings.algorithm")}</th>
              <th>{t("findings.category")}</th>
              <th>{t("findings.context")}</th>
              <th>{t("findings.location")}</th>
              <th>{t("findings.confidence")}</th>
            </tr>
          </thead>
          <tbody>
            {paginatedFindings.map((finding) => (
              <tr key={finding.id}>
                <td>
                  <span className={`badge ${finding.riskLevel}`}>{t(`risk.levels.${finding.riskLevel}`)}</span>
                </td>
                <td>{finding.algorithm}</td>
                <td>{finding.category}</td>
                <td>{t(`findings.contexts.${finding.fileContext}`)}</td>
                <td>{renderLocation(finding, repositoryUrl, defaultBranch, t("findings.unknownLocation"))}</td>
                <td>{Math.round(finding.confidence * 100)}%</td>
              </tr>
            ))}
            {filteredFindings.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  {findings.length === 0
                    ? isScanCompleted
                      ? t("findings.completedWithoutFindings")
                      : t("findings.noFindings")
                    : t("findings.noMatches")}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <div className="pagination-bar">
        <label>
          <span>{t("findings.rowsPerPage")}</span>
          <select
            value={pageSize}
            onChange={(event) => setPageSize(Number(event.target.value) as (typeof pageSizeOptions)[number])}
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <div className="pagination-controls">
          <button type="button" disabled={page === 1} onClick={() => setPage((currentPage) => currentPage - 1)}>
            {t("findings.previousPage")}
          </button>
          <span>{t("findings.pageStatus", { page, totalPages })}</span>
          <button type="button" disabled={page === totalPages} onClick={() => setPage((currentPage) => currentPage + 1)}>
            {t("findings.nextPage")}
          </button>
        </div>
      </div>
    </section>
  );
}

function getAlgorithms(findings: Finding[]) {
  return Array.from(new Set(findings.map((finding) => finding.algorithm))).sort((a, b) => a.localeCompare(b));
}

function filterFindings(
  findings: Finding[],
  query: string,
  riskLevel: (typeof riskOptions)[number],
  algorithm: string,
  fileContext: (typeof contextOptions)[number]
) {
  const normalizedQuery = query.trim().toLowerCase();

  return findings
    .filter((finding) => {
      const matchesRisk = riskLevel === "all" || finding.riskLevel === riskLevel;
      const matchesAlgorithm = algorithm === "all" || finding.algorithm === algorithm;
      const matchesContext =
        fileContext === "all" ||
        (fileContext === "primary" ? primaryContexts.has(finding.fileContext) : finding.fileContext === fileContext);
      const searchableText = `${finding.algorithm} ${finding.category} ${finding.fileContext} ${finding.filePath ?? ""}`.toLowerCase();
      const matchesQuery = normalizedQuery.length === 0 || searchableText.includes(normalizedQuery);

      return matchesRisk && matchesAlgorithm && matchesContext && matchesQuery;
    })
    .sort((left, right) => {
      const riskSort = riskPriority[left.riskLevel] - riskPriority[right.riskLevel];

      if (riskSort !== 0) {
        return riskSort;
      }

      return left.algorithm.localeCompare(right.algorithm);
    });
}

function getContextOptionLabel(option: (typeof contextOptions)[number], t: ReturnType<typeof useI18n>["t"]) {
  if (option === "primary") {
    return t("findings.primaryContexts");
  }

  if (option === "all") {
    return t("findings.all");
  }

  return t(`findings.contexts.${option}`);
}

function renderLocation(finding: Finding, repositoryUrl: string | null, defaultBranch: string | null, unknownLocation: string) {
  if (!finding.filePath) {
    return unknownLocation;
  }

  const label = finding.line ? `${finding.filePath}:${finding.line}` : finding.filePath;
  const href = buildGitHubLocationUrl(repositoryUrl, defaultBranch, finding);

  if (!href) {
    return label;
  }

  return (
    <a className="location-link" href={href} target="_blank" rel="noreferrer">
      {label}
    </a>
  );
}

function buildGitHubLocationUrl(repositoryUrl: string | null, defaultBranch: string | null, finding: Finding) {
  if (!repositoryUrl || !finding.filePath || !repositoryUrl.startsWith("https://github.com/")) {
    return null;
  }

  const cleanRepositoryUrl = repositoryUrl.replace(/\.git$/, "").replace(/\/$/, "");
  const encodedPath = finding.filePath.split("/").map(encodeURIComponent).join("/");
  const lineSuffix = finding.line ? `#L${finding.line}` : "";

  return `${cleanRepositoryUrl}/blob/${defaultBranch ?? "HEAD"}/${encodedPath}${lineSuffix}`;
}

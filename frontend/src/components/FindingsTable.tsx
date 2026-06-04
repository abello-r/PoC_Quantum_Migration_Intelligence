import { type ReactNode, useEffect, useMemo, useState } from "react";
import { Dropdown } from "./Dropdown";
import {
  areFiltersActive,
  confidenceOptions,
  contextOptions,
  filterFindings,
  getAlgorithms,
  getAverageConfidence,
  getConfidenceOptionLabel,
  getContextLabel,
  getContextOptionLabel,
  getLocations,
  getUniqueValues,
  groupFindingsByLocation,
  initialFilters,
  pageSizeOptions,
  riskOptions,
  sortOptionsByLabel,
  type FindingLocationGroup,
  type FindingsFilters,
  type RiskFilter
} from "./findingsTableModel";
import { t } from "../i18n";
import type { Finding } from "../lib/api";
import { buildGitHubLocationUrl, formatCategory } from "../lib/findingPaths";

type FindingsTableProps = {
  findings: Finding[];
  repositoryUrl: string | null;
  defaultBranch: string | null;
  isScanCompleted: boolean;
  selectedRisk: RiskFilter;
  onRiskFilterChange: (risk: RiskFilter) => void;
};

export function FindingsTable({
  findings,
  repositoryUrl,
  defaultBranch,
  isScanCompleted,
  selectedRisk,
  onRiskFilterChange
}: FindingsTableProps) {
  const [filters, setFilters] = useState<FindingsFilters>(initialFilters);
  const [pageSize, setPageSize] = useState<(typeof pageSizeOptions)[number]>(10);
  const [page, setPage] = useState(1);
  const algorithms = useMemo(() => getAlgorithms(findings), [findings]);
  const categories = useMemo(() => getUniqueValues(findings.map((finding) => finding.category)), [findings]);
  const locations = useMemo(() => getLocations(findings), [findings]);
  const algorithmOptions = useMemo(
    () => [
      { label: t("findings.allAlgorithms"), value: "all" },
      ...algorithms.map((option) => ({ label: option, value: option }))
    ],
    [algorithms, t]
  );
  const riskDropdownOptions = useMemo(
    () => riskOptions.map((option) => ({ label: option === "all" ? t("findings.allRisks") : t(`risk.levels.${option}`), value: option })),
    [t]
  );
  const categoryOptions = useMemo(
    () => [
      { label: t("findings.allCategories"), value: "all" },
      ...categories.map((option) => ({ label: formatCategory(option), value: option }))
    ],
    [categories, t]
  );
  const contextDropdownOptions = useMemo(
    () => sortOptionsByLabel(contextOptions.map((option) => ({ label: getContextOptionLabel(option, t), value: option }))),
    [t]
  );
  const locationOptions = useMemo(
    () => [
      { label: t("findings.allLocations"), value: "all" },
      ...locations.map((option) => ({
        label: option === "__unknown" ? t("findings.unknownLocation") : option,
        value: option
      }))
    ],
    [locations, t]
  );
  const confidenceDropdownOptions = useMemo(
    () => confidenceOptions.map((option) => ({ label: getConfidenceOptionLabel(option, t), value: option })),
    [t]
  );
  const pageSizeDropdownOptions = useMemo(
    () => pageSizeOptions.map((option) => ({ label: String(option), value: option })),
    []
  );
  const filteredFindings = useMemo(
    () => filterFindings(findings, filters),
    [findings, filters]
  );
  const locationGroups = useMemo(
    () => groupFindingsByLocation(filteredFindings, repositoryUrl, defaultBranch, t("findings.unknownLocation")),
    [filteredFindings, repositoryUrl, defaultBranch]
  );
  const totalPages = Math.max(1, Math.ceil(locationGroups.length / pageSize));
  const paginatedLocationGroups = locationGroups.slice((page - 1) * pageSize, page * pageSize);
  const hasActiveFilters = areFiltersActive(filters);

  useEffect(() => {
    setPage(1);
  }, [filters, pageSize]);

  useEffect(() => {
    setFilters((currentFilters) =>
      currentFilters.riskLevel === selectedRisk ? currentFilters : { ...currentFilters, riskLevel: selectedRisk }
    );
  }, [selectedRisk]);

  useEffect(() => {
    setPage((currentPage) => Math.min(currentPage, totalPages));
  }, [totalPages]);

  return (
    <section id="findings-table" className="panel table-panel" aria-label={t("findings.ariaLabel")}>
      <div className="panel-heading findings-heading">
        <div>
          <p className="eyebrow">{t("findings.eyebrow")}</p>
          <h2>{t("findings.title")}</h2>
        </div>
        <span>{t("findings.count", { filtered: filteredFindings.length, total: findings.length })}</span>
      </div>
      <div className="filters" aria-label={t("findings.filtersAriaLabel")}>
        <label className="search-filter">
          <span>{t("findings.search")}</span>
          <input
            type="search"
            placeholder={t("findings.searchPlaceholder")}
            value={filters.query}
            onChange={(event) => setFilter("query", event.target.value)}
          />
        </label>
        <button
          type="button"
          className="clear-filters"
          disabled={!hasActiveFilters}
          onClick={clearFilters}
        >
          {t("findings.clearFilters")}
        </button>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>
                <ColumnFilter
                  label={t("findings.risk")}
                  control={
                    <Dropdown
                      ariaLabel={t("findings.risk")}
                      className="column-filter-menu"
                      options={riskDropdownOptions}
                      value={filters.riskLevel}
                      onChange={(value) => setFilter("riskLevel", value)}
                      leadingIcon="filter"
                      iconOnly
                      isActive={filters.riskLevel !== "all"}
                    />
                  }
                />
              </th>
              <th>
                <ColumnFilter
                  label={t("findings.algorithm")}
                  control={
                    <Dropdown
                      ariaLabel={t("findings.algorithm")}
                      className="column-filter-menu"
                      options={algorithmOptions}
                      value={filters.algorithm}
                      onChange={(value) => setFilter("algorithm", value)}
                      leadingIcon="filter"
                      iconOnly
                      isActive={filters.algorithm !== "all"}
                    />
                  }
                />
              </th>
              <th>
                <ColumnFilter
                  label={t("findings.category")}
                  control={
                    <Dropdown
                      ariaLabel={t("findings.category")}
                      className="column-filter-menu"
                      options={categoryOptions}
                      value={filters.category}
                      onChange={(value) => setFilter("category", value)}
                      leadingIcon="filter"
                      iconOnly
                      isActive={filters.category !== "all"}
                    />
                  }
                />
              </th>
              <th>
                <ColumnFilter
                  label={t("findings.context")}
                  control={
                    <Dropdown
                      ariaLabel={t("findings.context")}
                      className="column-filter-menu"
                      options={contextDropdownOptions}
                      value={filters.fileContext}
                      onChange={(value) => setFilter("fileContext", value)}
                      leadingIcon="filter"
                      iconOnly
                      isActive={filters.fileContext !== "all"}
                    />
                  }
                />
              </th>
              <th>
                <ColumnFilter
                  label={t("findings.location")}
                  control={
                    <Dropdown
                      ariaLabel={t("findings.location")}
                      className="column-filter-menu"
                      options={locationOptions}
                      value={filters.location}
                      onChange={(value) => setFilter("location", value)}
                      leadingIcon="filter"
                      iconOnly
                      isActive={filters.location !== "all"}
                    />
                  }
                />
              </th>
              <th>
                <ColumnFilter
                  label={t("findings.confidence")}
                  control={
                    <Dropdown
                      ariaLabel={t("findings.confidence")}
                      className="column-filter-menu"
                      options={confidenceDropdownOptions}
                      value={filters.confidence}
                      onChange={(value) => setFilter("confidence", value)}
                      leadingIcon="filter"
                      iconOnly
                      isActive={filters.confidence !== "all"}
                    />
                  }
                />
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedLocationGroups.map((group) => (
              <LocationGroupRows key={group.key} group={group} repositoryUrl={repositoryUrl} defaultBranch={defaultBranch} />
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
          <Dropdown
            ariaLabel={t("findings.rowsPerPage")}
            className="page-size-menu"
            options={pageSizeDropdownOptions}
            value={pageSize}
            onChange={setPageSize}
          />
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

  function setFilter<Key extends keyof FindingsFilters>(key: Key, value: FindingsFilters[Key]) {
    setFilters((currentFilters) => ({ ...currentFilters, [key]: value }));

    if (key === "riskLevel") {
      onRiskFilterChange(value as RiskFilter);
    }
  }

  function clearFilters() {
    setFilters(initialFilters);
    onRiskFilterChange("all");
  }
}

function LocationGroupRows({
  group,
  repositoryUrl,
  defaultBranch
}: {
  group: FindingLocationGroup;
  repositoryUrl: string | null;
  defaultBranch: string | null;
}) {
  return (
    <>
      <tr className="location-group-row">
        <td>
          <span className={`badge ${group.highestRisk}`}>{t(`risk.levels.${group.highestRisk}`)}</span>
        </td>
        <td colSpan={3}>
          {group.href ? (
            <a className="location-link" href={group.href} target="_blank" rel="noreferrer">
              {group.label}
            </a>
          ) : (
            group.label
          )}
        </td>
        <td>{t("findings.locationFindingCount", { count: group.findings.length })}</td>
        <td>{Math.round(getAverageConfidence(group.findings) * 100)}%</td>
      </tr>
      {group.findings.map((finding) => (
        <FindingDetailRow key={finding.id} finding={finding} groupLabel={group.label} repositoryUrl={repositoryUrl} defaultBranch={defaultBranch} />
      ))}
    </>
  );
}

function FindingDetailRow({
  finding,
  groupLabel,
  repositoryUrl,
  defaultBranch
}: {
  finding: Finding;
  groupLabel: string;
  repositoryUrl: string | null;
  defaultBranch: string | null;
}) {
  const href = buildGitHubLocationUrl(repositoryUrl, defaultBranch, finding);

  return (
    <tr className="finding-detail-row">
      <td>
        <span className={`badge ${finding.riskLevel}`}>{t(`risk.levels.${finding.riskLevel}`)}</span>
      </td>
      <td>{finding.algorithm}</td>
      <td>{formatCategory(finding.category)}</td>
      <td>{getContextLabel(finding.fileContext, t)}</td>
      <td>
        {href ? (
          <a className="location-link" href={href} target="_blank" rel="noreferrer">
            {finding.line ? `Line ${finding.line}` : groupLabel}
          </a>
        ) : finding.line ? (
          `Line ${finding.line}`
        ) : (
          groupLabel
        )}
      </td>
      <td>{Math.round(finding.confidence * 100)}%</td>
    </tr>
  );
}

function ColumnFilter({ label, control }: { label: string; control: ReactNode }) {
  return (
    <div className="column-filter">
      <span>{label}</span>
      {control}
    </div>
  );
}

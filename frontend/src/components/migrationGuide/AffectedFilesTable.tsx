import { t } from "../../i18n";
import type { Finding } from "../../lib/api";
import { buildGitHubLocationUrl, formatCategory, formatFindingLocation } from "../../lib/findingPaths";

type AffectedFilesTableProps = {
  findings: Finding[];
  repositoryUrl: string;
  defaultBranch: string | null;
};

const maxVisibleFindings = 12;

export function AffectedFilesTable({ findings, repositoryUrl, defaultBranch }: AffectedFilesTableProps) {
  const visibleFindings = findings.slice(0, maxVisibleFindings);

  return (
    <section className="remediation-files panel">
      <div className="panel-heading findings-heading">
        <div>
          <p className="eyebrow">{t("migrationGuide.evidenceTitle")}</p>
          <h2>{t("migrationGuide.evidenceAffectedFiles")}</h2>
        </div>
        <span>{t("migrationGuide.filesCount", { count: findings.length })}</span>
      </div>

      {visibleFindings.length > 0 ? (
        <div className="remediation-table-scroll">
          <table className="remediation-files-table">
            <thead>
              <tr>
                <th>{t("findings.risk")}</th>
                <th>{t("findings.algorithm")}</th>
                <th>{t("findings.category")}</th>
                <th>{t("findings.location")}</th>
                <th>{t("findings.confidence")}</th>
              </tr>
            </thead>
            <tbody>
              {visibleFindings.map((finding) => (
                <AffectedFileRow
                  key={finding.id}
                  finding={finding}
                  repositoryUrl={repositoryUrl}
                  defaultBranch={defaultBranch}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="remediation-empty">{t("migrationGuide.noAffectedFiles")}</p>
      )}

      {findings.length > visibleFindings.length ? (
        <p className="remediation-table-note">
          {t("migrationGuide.filesTruncated", { visible: visibleFindings.length, total: findings.length })}
        </p>
      ) : null}
    </section>
  );
}

function AffectedFileRow({
  finding,
  repositoryUrl,
  defaultBranch
}: {
  finding: Finding;
  repositoryUrl: string;
  defaultBranch: string | null;
}) {
  const href = buildGitHubLocationUrl(repositoryUrl, defaultBranch, finding);
  const location = formatFindingLocation(finding, t("findings.unknownLocation"));

  return (
    <tr>
      <td>
        <span className={`badge ${finding.riskLevel}`}>{t(`risk.levels.${finding.riskLevel}`)}</span>
      </td>
      <td>{finding.algorithm}</td>
      <td>{formatCategory(finding.category)}</td>
      <td>
        {href ? (
          <a className="location-link" href={href} target="_blank" rel="noreferrer">
            {location}
          </a>
        ) : (
          location
        )}
      </td>
      <td>{Math.round(finding.confidence * 100)}%</td>
    </tr>
  );
}

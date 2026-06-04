import { t, type Translate } from "../i18n";
import type { ScanDetail } from "../lib/api";

type ScanFormProps = {
  repositoryUrl: string;
  scan: ScanDetail | null;
  isLoading: boolean;
  onRepositoryUrlChange: (value: string) => void;
  onRunScan: () => void;
};

export function ScanForm({
  repositoryUrl,
  scan,
  isLoading,
  onRepositoryUrlChange,
  onRunScan
}: ScanFormProps) {
  return (
    <section className="panel scan-form" aria-label={t("scanForm.ariaLabel")}>
      <div className="panel-heading scan-form-heading">
        <p className="eyebrow">{t("scanForm.eyebrow")}</p>
        <h2>{t("scanForm.title")}</h2>
        {scan ? (
          <span className="scan-timestamp">
            {t("scanForm.scannedAt")} <strong>{formatDateTime(scan.startedAt ?? scan.createdAt)}</strong>
          </span>
        ) : null}
      </div>
      <div className="scan-controls">
        <label>
          <span>{t("scanForm.repositoryUrl")}</span>
          <input
            type="url"
            placeholder={t("scanForm.repositoryPlaceholder")}
            value={repositoryUrl}
            onChange={(event) => onRepositoryUrlChange(event.target.value)}
          />
        </label>
        <button type="button" onClick={onRunScan} disabled={isLoading || repositoryUrl.length === 0}>
          {isLoading ? t("scanForm.startingScan") : t("scanForm.runScan")}
        </button>
      </div>
      {scan ? <RepositoryContext scan={scan} /> : null}
    </section>
  );
}

function RepositoryContext({ scan }: { scan: ScanDetail }) {
  return (
    <div className="repository-metadata-panel scan-repository-context">
      <div className="repository-source">
        {scan.repositoryAvatarUrl ? (
          <img src={scan.repositoryAvatarUrl} alt={t("summary.githubAvatarAlt")} />
        ) : (
          <div className="repository-avatar-placeholder" aria-hidden="true" />
        )}
        <div>
          <span className="github-source-label">
            <GitHubIcon />
            {t("summary.githubSource")}
          </span>
          <strong>{scan.repositoryFullName ?? scan.target}</strong>
          <a className="repository-target-link" href={scan.target} target="_blank" rel="noreferrer">
            {scan.target}
          </a>
        </div>
      </div>
      <div className="repository-metadata-grid">
        <MetadataItem label={t("summary.defaultBranch")} value={scan.repositoryDefaultBranch ?? t("summary.unknownMetadata")} />
        <MetadataItem label={t("summary.language")} value={scan.repositoryLanguage ?? t("summary.unknownMetadata")} />
        <MetadataItem label={t("summary.visibility")} value={scan.repositoryVisibility ?? t("summary.unknownMetadata")} />
        <MetadataItem label={t("summary.size")} value={formatRepositorySize(scan.repositorySizeKb, t)} />
        <MetadataItem label={t("summary.pushed")} value={formatDate(scan.repositoryPushedAt, t("summary.unknownMetadata"))} />
      </div>
    </div>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2.5a9.5 9.5 0 0 0-3 18.5c.48.08.65-.2.65-.46v-1.62c-2.65.58-3.2-1.12-3.2-1.12-.44-1.1-1.06-1.4-1.06-1.4-.86-.58.07-.57.07-.57.95.07 1.45.98 1.45.98.85 1.44 2.22 1.02 2.76.78.09-.62.33-1.02.6-1.26-2.12-.24-4.35-1.06-4.35-4.72 0-1.04.37-1.9.98-2.56-.1-.24-.42-1.22.1-2.53 0 0 .8-.26 2.62.98a9 9 0 0 1 4.76 0c1.82-1.24 2.62-.98 2.62-.98.52 1.31.2 2.29.1 2.53.61.66.98 1.52.98 2.56 0 3.67-2.24 4.48-4.37 4.72.34.3.64.88.64 1.77v2.62c0 .26.17.55.66.46A9.5 9.5 0 0 0 12 2.5Z" />
    </svg>
  );
}

function MetadataItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="metadata-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function formatRepositorySize(sizeKb: number | null, t: Translate) {
  if (sizeKb == null) {
    return "--";
  }

  if (sizeKb >= 1024) {
    return t("summary.sizeMb", { size: (sizeKb / 1024).toFixed(1) });
  }

  return t("summary.sizeKb", { size: sizeKb.toLocaleString() });
}

function formatDate(value: string | null, fallback: string) {
  if (!value) {
    return fallback;
  }

  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

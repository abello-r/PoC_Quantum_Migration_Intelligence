import { useEffect, useState } from "react";
import { useI18n } from "../i18n";
import type { ScanDetail } from "../lib/api";

type SummaryPanelProps = {
  scan: ScanDetail | null;
  isSubmitting: boolean;
};

export function SummaryPanel({ scan, isSubmitting }: SummaryPanelProps) {
  const { t } = useI18n();
  const [, setClockTick] = useState(0);
  const totalFindings = scan ? scan.findings.length : 0;
  const status = getStatusKey(scan?.status, isSubmitting);
  const isActive = isSubmitting || scan?.status === "running" || scan?.status === "pending";
  const target = scan?.target ?? t("summary.noScanSelected");
  const progress = isSubmitting ? 4 : scan?.progress ?? 0;
  const elapsedSeconds = getElapsedSeconds(scan?.startedAt ?? null, scan?.finishedAt ?? null);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const interval = window.setInterval(() => setClockTick((current) => current + 1), 1000);

    return () => window.clearInterval(interval);
  }, [isActive]);

  return (
    <section className="panel summary-panel" aria-label={t("summary.ariaLabel")}>
      <div className="summary-head">
        <div>
          <p className="eyebrow">{isActive ? t("summary.activeEyebrow") : t("summary.eyebrow")}</p>
          <p className="summary-description">{t("summary.description")}</p>
        </div>
        <strong className={`score ${getScoreClass(scan?.score ?? null)}`}>
          <span>{scan?.score ?? "--"}</span>
          <small>/100</small>
        </strong>
      </div>
      <div className="summary-body">
        <div className="scan-progress-block">
          <div className="progress-label">
            <span>{scan ? t(`summary.stages.${scan.stage}`) : t("summary.waitingForScan")}</span>
            <strong>{progress}%</strong>
          </div>
          <div className="progress-track" aria-label={t("summary.progress")}>
            <span style={{ width: `${progress}%` }} />
          </div>
          {scan?.lastMessage ? <p>{t(getSummaryMessageKey(scan.lastMessage))}</p> : null}
        </div>
        <div className="summary-metrics">
          <div className="metric">
            <span>{t("summary.status")}</span>
            <strong className={`status-pill ${status}`}>{t(`summary.statuses.${status}`)}</strong>
          </div>
          <div className="metric">
            <span>{t("summary.findings")}</span>
            <strong>{totalFindings}</strong>
          </div>
        </div>
        <div className="coverage-grid">
          <CoverageMetric label={t("summary.filesDiscovered")} value={scan?.filesDiscovered ?? 0} />
          <CoverageMetric label={t("summary.filesCandidates")} value={scan?.filesCandidates ?? 0} />
          <CoverageMetric label={t("summary.filesScanned")} value={scan?.filesScanned ?? 0} />
          <CoverageMetric label={t("summary.filesSkipped")} value={scan?.filesSkipped ?? 0} />
          <CoverageMetric label={t("summary.elapsedTime")} value={t("summary.secondsShort", { seconds: elapsedSeconds })} />
        </div>
      </div>
      {scan?.scanLimitApplied ? (
        <div className="scan-limit-cta">
          <div className="scan-limit-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M12 3 4.5 7.2v5.5c0 3.9 2.6 6.8 7.5 8.3 4.9-1.5 7.5-4.4 7.5-8.3V7.2L12 3Z" />
              <path d="M8.5 12h7M12 8.5v7" />
            </svg>
          </div>
          <div>
            <strong>{t("summary.limitAppliedTitle")}</strong>
            <p>{t("summary.limitAppliedDescription", { count: scan.filesScanned.toLocaleString() })}</p>
          </div>
          <button type="button">{t("summary.limitAppliedAction")}</button>
        </div>
      ) : null}
      {scan?.status === "completed" && scan.findings.length === 0 ? (
        <div className="scan-note">{t("summary.noFindingsMatched")}</div>
      ) : null}
      {scan ? (
        <div className="repository-metadata-panel">
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
              <strong>{scan.repositoryFullName ?? target}</strong>
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
      ) : null}
      <div className="target-box">
        <span>{t("summary.target")}</span>
        <strong>{target}</strong>
      </div>
      {scan?.errorMessage ? (
        <div className="scan-error">
          <span>{t("summary.scanError")}</span>
          <p>{scan.errorMessage}</p>
        </div>
      ) : null}
    </section>
  );
}

function CoverageMetric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="coverage-metric">
      <span>{label}</span>
      <strong>{typeof value === "number" ? value.toLocaleString() : value}</strong>
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

function getStatusKey(status: ScanDetail["status"] | undefined, isSubmitting: boolean) {
  if (isSubmitting) {
    return "starting";
  }

  return status ?? "idle";
}

function getElapsedSeconds(startedAt: string | null, finishedAt: string | null) {
  if (!startedAt) {
    return 0;
  }

  const endTime = finishedAt ? new Date(finishedAt).getTime() : Date.now();
  const startTime = new Date(startedAt).getTime();

  return Math.max(0, Math.round((endTime - startTime) / 1000));
}

function getScoreClass(score: number | null) {
  if (score == null) {
    return "empty";
  }

  if (score >= 80) {
    return "high";
  }

  if (score >= 50) {
    return "medium";
  }

  if (score >= 25) {
    return "low";
  }

  return "critical";
}

function formatRepositorySize(sizeKb: number | null, t: (key: "summary.sizeKb" | "summary.sizeMb", values: Record<string, string | number>) => string) {
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

function getSummaryMessageKey(message: string) {
  switch (message) {
    case "scanQueued":
      return "summary.messages.scanQueued";
    case "cloningRepository":
      return "summary.messages.cloningRepository";
    case "discoveringFiles":
      return "summary.messages.discoveringFiles";
    case "analyzingCandidateFiles":
      return "summary.messages.analyzingCandidateFiles";
    case "generatingMigrationPlan":
      return "summary.messages.generatingMigrationPlan";
    case "scanCompleted":
      return "summary.messages.scanCompleted";
    case "scanCompletedWithoutFindings":
      return "summary.messages.scanCompletedWithoutFindings";
    case "scanFailed":
      return "summary.messages.scanFailed";
    default:
      return "summary.messages.scanQueued";
  }
}

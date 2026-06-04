import { useEffect, useState } from "react";
import { t } from "../i18n";
import type { ScanDetail } from "../lib/api";

type SummaryPanelProps = {
  scan: ScanDetail | null;
  requestFailure: {
    target: string;
    message: string;
  } | null;
  isSubmitting: boolean;
  isCanceling: boolean;
  onCancelScan: () => void;
  onSignInUnavailable: () => void;
};

export function SummaryPanel({
  scan,
  requestFailure,
  isSubmitting,
  isCanceling,
  onCancelScan,
  onSignInUnavailable
}: SummaryPanelProps) {
  const [, setClockTick] = useState(0);
  const hasRequestFailure = !scan && requestFailure !== null;
  const totalFindings = scan ? scan.findings.length : 0;
  const status = hasRequestFailure ? "failed" : getStatusKey(scan?.status, isSubmitting);
  const isActive = isSubmitting || scan?.status === "running" || scan?.status === "pending";
  const canCancelScan = scan?.status === "running" || scan?.status === "pending";
  const progress = isSubmitting ? 4 : scan?.progress ?? 0;
  const elapsedSeconds = getElapsedSeconds(scan?.startedAt ?? null, scan?.finishedAt ?? null);
  const progressDetail = getProgressDetail(scan, isSubmitting, hasRequestFailure);

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
      {scan?.errorMessage || requestFailure?.message ? (
        <div className="scan-error">
          <span>{t("summary.scanError")}</span>
          <p>{scan?.errorMessage ?? requestFailure?.message}</p>
        </div>
      ) : null}
      <div className="summary-body">
        <div className="scan-progress-block">
          <div className="progress-label">
            <span>{getProgressTitle(scan, isSubmitting, hasRequestFailure)}</span>
            <strong>{t("summary.progressWithElapsed", { progress, elapsed: elapsedSeconds })}</strong>
          </div>
          <div className="progress-track" aria-label={t("summary.progress")}>
            <span style={{ width: `${progress}%` }} />
          </div>
          <div className="progress-detail">
            <span>{progressDetail}</span>
            {scan?.lastMessage ? <strong>{t(getSummaryMessageKey(scan.lastMessage))}</strong> : null}
          </div>
          {canCancelScan ? (
            <div className="progress-actions">
              <button type="button" className="cancel-scan-button" onClick={onCancelScan} disabled={isCanceling}>
                {isCanceling ? t("summary.cancelingScan") : t("summary.cancelScan")}
              </button>
            </div>
          ) : null}
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
          <button type="button" onClick={onSignInUnavailable}>{t("summary.limitAppliedAction")}</button>
        </div>
      ) : null}
      {scan?.status === "completed" && scan.findings.length === 0 ? (
        <div className="scan-note">{t("summary.noFindingsMatched")}</div>
      ) : null}
    </section>
  );
}

function getProgressTitle(scan: ScanDetail | null, isSubmitting: boolean, hasRequestFailure: boolean) {
  if (hasRequestFailure) {
    return t("summary.requestFailedStage");
  }

  if (scan) {
    return t(`summary.stages.${scan.stage}`);
  }

  if (isSubmitting) {
    return t("summary.stages.queued");
  }

  return t("summary.waitingForScan");
}

function getProgressDetail(scan: ScanDetail | null, isSubmitting: boolean, hasRequestFailure: boolean) {
  if (hasRequestFailure) {
    return t("summary.progressDetails.requestFailed");
  }

  if (isSubmitting) {
    return t("summary.progressDetails.starting");
  }

  if (!scan) {
    return t("summary.progressDetails.idle");
  }

  if (scan.stage === "cloning") {
    return t("summary.progressDetails.cloning");
  }

  if (scan.stage === "discovering") {
    return t("summary.progressDetails.discovering");
  }

  if (scan.stage === "analyzing") {
    if (scan.filesCandidates > 0) {
      return t("summary.progressDetails.analyzingWithFiles", {
        scanned: scan.filesScanned.toLocaleString(),
        candidates: scan.filesCandidates.toLocaleString(),
        skipped: scan.filesSkipped.toLocaleString()
      });
    }

    return t("summary.progressDetails.analyzingEstimated");
  }

  if (scan.stage === "planning") {
    return t("summary.progressDetails.planning");
  }

  if (scan.stage === "completed") {
    return t("summary.progressDetails.completed", { findings: scan.findings.length.toLocaleString() });
  }

  if (scan.stage === "failed") {
    return t("summary.progressDetails.failed");
  }

  if (scan.stage === "canceled") {
    return t("summary.progressDetails.canceled");
  }

  return t("summary.progressDetails.idle");
}

function CoverageMetric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="coverage-metric">
      <span>{label}</span>
      <strong>{typeof value === "number" ? value.toLocaleString() : value}</strong>
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
    case "scanCanceled":
      return "summary.messages.scanCanceled";
    default:
      return "summary.messages.scanQueued";
  }
}

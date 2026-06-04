import { t } from "../../i18n";
import type { MigrationRecommendation } from "../../lib/api";
import { StatusMetric } from "./primitives";

type RemediationHeaderProps = {
  recommendation: MigrationRecommendation;
  findingsCount: number;
  highestRisk: string;
  onBack: () => void;
};

export function RemediationHeader({ recommendation, findingsCount, highestRisk, onBack }: RemediationHeaderProps) {
  return (
    <header className="remediation-header">
      <button type="button" className="back-button" onClick={onBack}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M15 6 9 12l6 6" />
          <path d="M10 12h10" />
        </svg>
        {t("migrationGuide.back")}
      </button>
      <div className="remediation-title-block">
        <p className="eyebrow">{t("migrationGuide.eyebrow")}</p>
        <h1>{recommendation.title}</h1>
        <div className="guide-title-bar" aria-hidden="true" />
      </div>
      <div className="remediation-status-grid" aria-label={t("migrationGuide.summary")}>
        <StatusMetric icon={<PriorityIcon />} label={t("migrationGuide.priority")} value={String(recommendation.priority)} tone="primary" />
        <StatusMetric icon={<EffortIcon />} label={t("migrationGuide.effort")} value={recommendation.effort} />
        <StatusMetric icon={<FindingsIcon />} label={t("migrationGuide.findings")} value={findingsCount.toLocaleString()} />
        <StatusMetric icon={<RiskIcon />} label={t("migrationGuide.highestRisk")} value={highestRisk} tone={getRiskTone(highestRisk)} />
      </div>
    </header>
  );
}

function getRiskTone(riskLabel: string) {
  const normalizedRisk = riskLabel.toLowerCase();

  if (normalizedRisk.includes("critical") || normalizedRisk.includes("vulnerable")) {
    return "danger";
  }

  if (normalizedRisk.includes("partial") || normalizedRisk.includes("unknown")) {
    return "warning";
  }

  return "neutral";
}

function PriorityIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4v10" />
      <path d="M8 8l4-4 4 4" />
      <path d="M5 20h14" />
    </svg>
  );
}

function EffortIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="M8 15v-4" />
      <path d="M12 15V8" />
      <path d="M16 15v-2" />
    </svg>
  );
}

function FindingsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 7h10" />
      <path d="M7 12h10" />
      <path d="M7 17h6" />
      <path d="M5 3h14a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
    </svg>
  );
}

function RiskIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4 3.5 19h17L12 4Z" />
      <path d="M12 9v4" />
      <path d="M12 16.5h.01" />
    </svg>
  );
}

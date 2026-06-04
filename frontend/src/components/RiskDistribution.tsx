import { t } from "../i18n";
import type { RiskLevel, RiskSummary } from "../lib/api";

const riskOrder: RiskLevel[] = ["critical", "vulnerable", "partial", "hybrid", "safe", "unknown"];

type RiskDistributionProps = {
  summary: RiskSummary | null;
  selectedRisk: RiskLevel | "all";
  onRiskSelect: (risk: RiskLevel) => void;
};

export function RiskDistribution({ summary, selectedRisk, onRiskSelect }: RiskDistributionProps) {
  const totalFindings = riskOrder.reduce((total, risk) => total + (summary?.[risk] ?? 0), 0);
  const reviewCount = (summary?.critical ?? 0) + (summary?.vulnerable ?? 0) + (summary?.partial ?? 0) + (summary?.unknown ?? 0);
  const summaryText = summary
    ? reviewCount > 0
      ? t("risk.reviewSummary", { count: reviewCount, total: totalFindings })
      : t("risk.clearSummary", { total: totalFindings })
    : t("risk.emptySummary");

  return (
    <section className="panel" aria-label={t("risk.ariaLabel")}>
      <div className="panel-heading">
        <p className="eyebrow">{t("risk.eyebrow")}</p>
        <div className="heading-with-tooltip">
          <h2>{t("risk.title")}</h2>
          <span className="info-tooltip">
            <button type="button" aria-label={t("risk.tooltipLabel")} aria-describedby="risk-level-tooltip">
              i
            </button>
            <span id="risk-level-tooltip" role="tooltip">
              <strong>{t("risk.tooltipTitle")}</strong>
              <span>{t("risk.tooltip.critical")}</span>
              <span>{t("risk.tooltip.vulnerable")}</span>
              <span>{t("risk.tooltip.partial")}</span>
              <span>{t("risk.tooltip.hybrid")}</span>
              <span>{t("risk.tooltip.safe")}</span>
              <span>{t("risk.tooltip.unknown")}</span>
            </span>
          </span>
        </div>
        <p className="risk-summary">{summaryText}</p>
      </div>
      <div className="risk-grid">
        {riskOrder.map((risk) => {
          const count = summary?.[risk] ?? 0;
          const isSelected = selectedRisk === risk;

          return (
            <button
              key={risk}
              type="button"
              className={`risk-pill ${risk}${isSelected ? " active" : ""}`}
              disabled={count === 0}
              aria-pressed={isSelected}
              onClick={() => onRiskSelect(risk)}
            >
              <div className="risk-pill-copy">
                <span>{t(`risk.levels.${risk}`)}</span>
                <small>{formatShare(count, totalFindings)} of findings</small>
              </div>
              <strong>
                {count}
                <small>findings</small>
              </strong>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function formatShare(count: number, total: number) {
  if (total === 0 || count === 0) {
    return "0%";
  }

  const share = getShare(count, total);

  return share < 1 ? "<1%" : `${Math.round(share)}%`;
}

function getShare(count: number, total: number) {
  return total > 0 ? (count / total) * 100 : 0;
}

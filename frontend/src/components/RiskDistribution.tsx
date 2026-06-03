import { useI18n } from "../i18n";
import type { RiskLevel, RiskSummary } from "../lib/api";

const riskOrder: RiskLevel[] = ["critical", "vulnerable", "partial", "hybrid", "safe", "unknown"];

type RiskDistributionProps = {
  summary: RiskSummary | null;
};

export function RiskDistribution({ summary }: RiskDistributionProps) {
  const { t } = useI18n();

  return (
    <section className="panel" aria-label={t("risk.ariaLabel")}>
      <div className="panel-heading">
        <p className="eyebrow">{t("risk.eyebrow")}</p>
        <h2>{t("risk.title")}</h2>
      </div>
      <div className="risk-grid">
        {riskOrder.map((risk) => (
          <div key={risk} className={`risk-pill ${risk}`}>
            <span>{t(`risk.levels.${risk}`)}</span>
            <strong>{summary?.[risk] ?? 0}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

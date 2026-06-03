import { useI18n } from "../i18n";
import type { MigrationRecommendation } from "../lib/api";

type MigrationPlanPanelProps = {
  recommendations: MigrationRecommendation[];
};

export function MigrationPlanPanel({ recommendations }: MigrationPlanPanelProps) {
  const { t } = useI18n();

  return (
    <section className="panel plan-panel" aria-label={t("migrationPlan.ariaLabel")}>
      <div className="panel-heading">
        <p className="eyebrow">{t("migrationPlan.eyebrow")}</p>
        <h2>{t("migrationPlan.title")}</h2>
      </div>
      <div className="recommendations">
        {recommendations.map((recommendation) => (
          <article key={recommendation.id} className="recommendation">
            <div className="priority">P{recommendation.priority}</div>
            <div>
              <div className="recommendation-title">
                <h3>{recommendation.title}</h3>
                <span>{recommendation.effort} {t("migrationPlan.effortSuffix")}</span>
              </div>
              <p>{recommendation.rationale}</p>
              <p>{recommendation.recommendedAction}</p>
            </div>
          </article>
        ))}
        {recommendations.length === 0 ? (
          <div className="roadmap-empty">
            <div className="roadmap-empty-intro">
              <div className="roadmap-empty-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M12 3 4.5 7.2v5.5c0 3.9 2.6 6.8 7.5 8.3 4.9-1.5 7.5-4.4 7.5-8.3V7.2L12 3Z" />
                  <path d="M8.5 12h7M12 8.5v7" />
                </svg>
              </div>
              <div className="roadmap-empty-copy">
                <h3>{t("migrationPlan.emptyTitle")}</h3>
                <p>{t("migrationPlan.emptyDescription")}</p>
              </div>
            </div>
            <div className="roadmap-empty-cards">
              <InfoCard title={t("migrationPlan.emptyCards.algorithm.title")} body={t("migrationPlan.emptyCards.algorithm.body")} />
              <InfoCard title={t("migrationPlan.emptyCards.rationale.title")} body={t("migrationPlan.emptyCards.rationale.body")} />
              <InfoCard title={t("migrationPlan.emptyCards.replacement.title")} body={t("migrationPlan.emptyCards.replacement.body")} />
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function InfoCard({ title, body }: { title: string; body: string }) {
  return (
    <article className="roadmap-info-card">
      <h4>{title}</h4>
      <p>{body}</p>
    </article>
  );
}

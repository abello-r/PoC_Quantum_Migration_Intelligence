import { useEffect, useMemo, useState } from "react";
import { t } from "../i18n";
import type { MigrationRecommendation } from "../lib/api";

const recommendationsPerPage = 3;

type MigrationPlanPanelProps = {
  recommendations: MigrationRecommendation[];
  onOpenGuide: (recommendationId: string) => void;
  onOpenAlgorithmDocs: (target: string) => void;
};

export function MigrationPlanPanel({ recommendations, onOpenGuide, onOpenAlgorithmDocs }: MigrationPlanPanelProps) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(recommendations.length / recommendationsPerPage));
  const visibleRecommendations = useMemo(
    () => recommendations.slice((page - 1) * recommendationsPerPage, page * recommendationsPerPage),
    [page, recommendations]
  );

  useEffect(() => {
    setPage((currentPage) => Math.min(currentPage, totalPages));
  }, [totalPages]);

  return (
    <section className="panel plan-panel" aria-label={t("migrationPlan.ariaLabel")}>
      <div className="panel-heading">
        <p className="eyebrow">{t("migrationPlan.eyebrow")}</p>
        <h2>{t("migrationPlan.title")}</h2>
      </div>
      <div className="recommendations">
        {visibleRecommendations.map((recommendation) => (
          <article key={recommendation.id} className="recommendation">
            <div className="recommendation-marker" aria-hidden="true" />
            <button
              type="button"
              className="recommendation-open"
              aria-label={t("migrationPlan.openGuideFor", { title: recommendation.title })}
              onClick={() => onOpenGuide(recommendation.id)}
            >
              <div className="recommendation-title">
                <div>
                  <h3>{recommendation.title}</h3>
                  <span>{recommendation.effort} {t("migrationPlan.effortSuffix")}</span>
                </div>
                <span className="recommendation-arrow" aria-hidden="true">
                  <svg viewBox="0 0 24 24" focusable="false">
                    <path d="M5 12h12" />
                    <path d="m13 6 6 6-6 6" />
                  </svg>
                </span>
              </div>
              <p>{recommendation.rationale}</p>
            </button>
          </article>
        ))}
        {recommendations.length > recommendationsPerPage ? (
          <div className="recommendation-pagination">
            <button type="button" disabled={page === 1} onClick={() => setPage((currentPage) => currentPage - 1)}>
              {t("migrationPlan.previousPage")}
            </button>
            <span>{t("migrationPlan.pageStatus", { page, totalPages })}</span>
            <button type="button" disabled={page === totalPages} onClick={() => setPage((currentPage) => currentPage + 1)}>
              {t("migrationPlan.nextPage")}
            </button>
          </div>
        ) : null}
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
        <button type="button" className="knowledge-base-card" onClick={() => onOpenAlgorithmDocs("Overview")}>
          <span className="knowledge-base-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M6 4.5h9.5A2.5 2.5 0 0 1 18 7v12.5H7.5A2.5 2.5 0 0 1 5 17V5.5a1 1 0 0 1 1-1Z" />
              <path d="M8 8h6M8 11h7M8 14h5" />
            </svg>
          </span>
          <span>
            <strong>{t("migrationPlan.knowledgeBase.title")}</strong>
            <small>{t("migrationPlan.knowledgeBase.description")}</small>
          </span>
          <span className="recommendation-arrow" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
              <path d="M5 12h12" />
              <path d="m13 6 6 6-6 6" />
            </svg>
          </span>
        </button>
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

import { t } from "../../i18n";
import type { MigrationRecommendation } from "../../lib/api";
import type { TransitionPath } from "./model";
import { ConsoleCard, FactRow } from "./primitives";

type RemediationConsoleProps = {
  recommendation: MigrationRecommendation;
  actionItems: string[];
  decision: string;
  inspectFirst: string;
  topAlgorithms: string[];
  transition: TransitionPath;
  onOpenAlgorithmDocs: (target: string) => void;
};

export function RemediationConsole({
  recommendation,
  actionItems,
  decision,
  inspectFirst,
  topAlgorithms,
  transition,
  onOpenAlgorithmDocs
}: RemediationConsoleProps) {
  return (
    <div className="remediation-console">
      <ConsoleCard eyebrow={t("migrationGuide.issueEyebrow")} title={t("migrationGuide.issueTitle")}>
        <p>{recommendation.rationale}</p>
        <div className="console-facts">
          <FactRow label={t("migrationGuide.algorithms")} value={topAlgorithms.length > 0 ? topAlgorithms.join(", ") : t("migrationGuide.noAlgorithmEvidence")} />
          <FactRow label={t("migrationGuide.inspectFirst")} value={inspectFirst} />
          <FactRow label={t("migrationGuide.decisionTitle")} value={decision} />
        </div>
      </ConsoleCard>

      <ConsoleCard eyebrow={t("migrationGuide.actionEyebrow")} title={t("migrationGuide.actionTitle")} tone="action">
        <div className="first-action">
          <span>{t("migrationGuide.firstMove")}</span>
          <strong>{actionItems[0] ?? recommendation.recommendedAction}</strong>
        </div>
        <ul className="remediation-checklist">
          {actionItems.slice(0, 5).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </ConsoleCard>

      <ConsoleCard eyebrow={t("migrationGuide.recommendationEyebrow")} title={t("migrationGuide.targetTitle")} className="target-card">
        <div className="target-stack">
          <span>{t("migrationGuide.safeTarget")}</span>
          <strong>{transition.target}</strong>
        </div>
        <p>{transition.body}</p>
        <ul className="target-notes">
          {transition.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <button type="button" className="target-docs-link" onClick={() => onOpenAlgorithmDocs(transition.target)}>
          {t("migrationGuide.algorithmDocs")}
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 17 17 7" />
            <path d="M9 7h8v8" />
          </svg>
        </button>
      </ConsoleCard>
    </div>
  );
}

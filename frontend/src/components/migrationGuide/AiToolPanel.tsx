import { t } from "../../i18n";

type AiToolPanelProps = {
  target: string;
  onSignInUnavailable: () => void;
};

export function AiToolPanel({ target, onSignInUnavailable }: AiToolPanelProps) {
  return (
    <section className="ai-tool-panel" aria-label={t("migrationGuide.aiTitle")}>
      <div>
        <p className="eyebrow">{t("migrationGuide.aiStatus")}</p>
        <h2>{t("migrationGuide.aiTitle")}</h2>
        <p>{t("migrationGuide.aiDescription")}</p>
      </div>
      <div className="ai-preview-box" aria-hidden="true">
        <span>{t("migrationGuide.aiPreviewInput")}</span>
        <strong>{target}</strong>
      </div>
      <button type="button" onClick={onSignInUnavailable}>
        {t("migrationGuide.aiAction")}
      </button>
    </section>
  );
}

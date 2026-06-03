import { useI18n } from "../i18n";

type ScanFormProps = {
  repositoryUrl: string;
  isLoading: boolean;
  onRepositoryUrlChange: (value: string) => void;
  onRunScan: () => void;
};

export function ScanForm({
  repositoryUrl,
  isLoading,
  onRepositoryUrlChange,
  onRunScan
}: ScanFormProps) {
  const { t } = useI18n();

  return (
    <section className="panel scan-form" aria-label={t("scanForm.ariaLabel")}>
      <div className="panel-heading">
        <p className="eyebrow">{t("scanForm.eyebrow")}</p>
        <h2>{t("scanForm.title")}</h2>
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
    </section>
  );
}

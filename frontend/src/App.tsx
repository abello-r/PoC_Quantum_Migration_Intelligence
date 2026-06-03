import React from "react";
import { FindingsTable } from "./components/FindingsTable";
import { MigrationPlanPanel } from "./components/MigrationPlanPanel";
import { RiskDistribution } from "./components/RiskDistribution";
import { ScanForm } from "./components/ScanForm";
import { SummaryPanel } from "./components/SummaryPanel";
import { ToastStack, type Toast } from "./components/ToastStack";
import { type Locale, useI18n } from "./i18n";
import { createRepositoryScan, fetchScan, fetchScans, type ScanDetail } from "./lib/api";

const lastScanStorageKey = "qmi:last-scan-id";
const lastRepositoryUrlStorageKey = "qmi:last-repository-url";

export function App() {
  const { locale, setLocale, t } = useI18n();
  const [repositoryUrl, setRepositoryUrl] = React.useState("");
  const [scan, setScan] = React.useState<ScanDetail | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const [isLanguageOpen, setIsLanguageOpen] = React.useState(false);
  const toastId = React.useRef(0);
  const languageOptions = [
    { label: t("nav.languages.en"), value: "en" },
    { label: t("nav.languages.es"), value: "es" }
  ] as const;

  React.useEffect(() => {
    document.title = t("app.documentTitle");
    document.documentElement.lang = locale;
  }, [locale, t]);

  React.useEffect(() => {
    let isMounted = true;
    const lastRepositoryUrl = window.localStorage.getItem(lastRepositoryUrlStorageKey);
    const lastScanId = window.localStorage.getItem(lastScanStorageKey);

    if (lastRepositoryUrl) {
      setRepositoryUrl(lastRepositoryUrl);
    }

    const restoreScan = async () => {
      const restoredScan = lastScanId ? await fetchScan(lastScanId).catch(() => null) : null;
      const latestScan = restoredScan ?? (await fetchLatestScan());

      if (!isMounted || !latestScan) {
        return;
      }

      setScan(latestScan);
      setRepositoryUrl(latestScan.target);
      persistLastScan(latestScan);
    };

    void restoreScan();

    return () => {
      isMounted = false;
    };
  }, []);

  React.useEffect(() => {
    if (!scan) {
      return;
    }

    persistLastScan(scan);
  }, [scan]);

  React.useEffect(() => {
    if (!scan || scan.status !== "running") {
      return;
    }

    const interval = window.setInterval(async () => {
      try {
        const updatedScan = await fetchScan(scan.id);
        setScan(updatedScan);

        if (updatedScan.status === "completed") {
          pushToast(t("toasts.scanCompleted", { count: updatedScan.findings.length }), "success");
          window.clearInterval(interval);
        }

        if (updatedScan.status === "failed") {
          pushToast(t("toasts.scanFailed"), "error");
          window.clearInterval(interval);
        }
      } catch (error) {
        pushToast(error instanceof Error ? error.message : t("toasts.refreshFailed"), "error");
        window.clearInterval(interval);
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [scan]);

  const runScan = async () => {
    setIsLoading(true);

    try {
      const nextScan = await createRepositoryScan(repositoryUrl);
      setScan(nextScan);
      persistLastScan(nextScan);
      pushToast(t("toasts.scanStarted"), "info");
    } catch (error) {
      pushToast(t("toasts.scanRequestFailed"), "error");
    } finally {
      setIsLoading(false);
    }
  };

  const pushToast = (message: string, tone: Toast["tone"]) => {
    const id = toastId.current + 1;
    toastId.current = id;

    setToasts((currentToasts) => [...currentToasts, { id, message, tone }]);
    window.setTimeout(() => dismissToast(id), 5000);
  };

  const dismissToast = (id: number) => {
    setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== id));
  };

  return (
    <main className="app-shell">
      <nav className="top-menu" aria-label={t("nav.ariaLabel")}>
        <div className="language-control">
          <span>{t("nav.language")}</span>
          <div className="language-menu">
            <button
              type="button"
              className="language-trigger"
              aria-expanded={isLanguageOpen}
              aria-haspopup="listbox"
              onClick={() => setIsLanguageOpen((current) => !current)}
            >
              {t(`nav.languages.${locale}`)}
              <span aria-hidden="true">⌄</span>
            </button>
            {isLanguageOpen ? (
              <div className="language-options" role="listbox" aria-label={t("nav.languageAriaLabel")}>
                {languageOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={locale === option.value}
                    onClick={() => {
                      setLocale(option.value as Locale);
                      setIsLanguageOpen(false);
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
        <div className="theme-control" aria-label={t("nav.theme")}>
          <button type="button" aria-label={t("nav.lightTheme")}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="4.5" />
              <path d="M12 3v1.7M12 19.3V21M4.2 4.2l1.2 1.2M18.6 18.6l1.2 1.2M3 12h1.7M19.3 12H21M4.2 19.8l1.2-1.2M18.6 5.4l1.2-1.2" />
            </svg>
          </button>
          <button type="button" aria-label={t("nav.darkTheme")}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M18.7 14.5A7.2 7.2 0 0 1 9.5 5.3 7.4 7.4 0 1 0 18.7 14.5Z" />
            </svg>
          </button>
        </div>
        <button type="button" className="menu-button sign-in">{t("nav.signIn")}</button>
      </nav>
      <header className="hero">
        <div className="hero-title-block">
          <div className="brand-row">
            <span className="brand-mark">QMI</span>
            <p className="eyebrow">{t("hero.eyebrow")}</p>
          </div>
          <h1>{t("hero.title")}</h1>
          <div className="title-motion-bar" aria-hidden="true" />
        </div>
        <div className="hero-copy">
          <p className="hero-kicker">{t("hero.kicker")}</p>
          <p>{t("hero.description")}</p>
        </div>
      </header>

      <ScanForm
        repositoryUrl={repositoryUrl}
        isLoading={isLoading}
        onRepositoryUrlChange={setRepositoryUrl}
        onRunScan={runScan}
      />
      <SummaryPanel scan={scan} isSubmitting={isLoading} />

      <section className="dashboard-grid">
        <RiskDistribution summary={scan?.riskSummary ?? null} />
        <MigrationPlanPanel recommendations={scan?.recommendations ?? []} />
      </section>

      <FindingsTable
        findings={scan?.findings ?? []}
        repositoryUrl={scan?.target ?? null}
        defaultBranch={scan?.repositoryDefaultBranch ?? null}
        isScanCompleted={scan?.status === "completed"}
      />
      <footer className="app-footer">
        <span>{t("footer.ecosystemIntent")}</span>
        <span className="footer-logos" aria-label={t("footer.logosLabel")}>
          <img src="/brand-assets/google-logo.png" alt={t("footer.googleLogoAlt")} />
          <span className="logo-link-mark" aria-hidden="true">{t("footer.linkMark")}</span>
          <img className="virustotal-logo" src="/brand-assets/virustotal-logo.png" alt={t("footer.virustotalLogoAlt")} />
        </span>
        <span className="footer-credit">
          {t("footer.inspiredBy")} <a href="https://qramm.org/open-source-tools.html" target="_blank" rel="noreferrer">{t("footer.qrammTools")}</a>.
        </span>
      </footer>
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </main>
  );
}

async function fetchLatestScan() {
  const scans = await fetchScans().catch(() => []);
  const latestScan = scans[0];

  return latestScan ? fetchScan(latestScan.id).catch(() => null) : null;
}

function persistLastScan(scan: ScanDetail) {
  window.localStorage.setItem(lastScanStorageKey, scan.id);
  window.localStorage.setItem(lastRepositoryUrlStorageKey, scan.target);
}

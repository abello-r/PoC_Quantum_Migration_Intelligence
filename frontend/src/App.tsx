import React from "react";
import { AlgorithmDocsPage } from "./components/AlgorithmDocsPage";
import { AppFooter, Hero, TopMenu } from "./components/AppChrome";
import { FindingsTable } from "./components/FindingsTable";
import { MigrationGuidePage } from "./components/MigrationGuidePage";
import { MigrationPlanPanel } from "./components/MigrationPlanPanel";
import { RiskDistribution } from "./components/RiskDistribution";
import { ScanForm } from "./components/ScanForm";
import { SummaryPanel } from "./components/SummaryPanel";
import { ToastStack, type Toast } from "./components/ToastStack";
import { t } from "./i18n";
import { cancelScan, createRepositoryScan, fetchScan, fetchScans, type RiskLevel, type ScanDetail } from "./lib/api";

const lastScanStorageKey = "qmi:last-scan-id";
const lastRepositoryUrlStorageKey = "qmi:last-repository-url";
const themeStorageKey = "qmi:theme";
type Theme = "light" | "dark";
type Route =
  | { name: "dashboard" }
  | { name: "migration-guide"; scanId: string; recommendationId: string }
  | { name: "algorithm-docs"; target: string; returnTo?: { scanId: string; recommendationId: string } };
type ScanRequestFailure = {
  target: string;
  message: string;
};
type RiskFilter = RiskLevel | "all";

export function App() {
  const [route, setRoute] = React.useState<Route>(() => parseRoute(window.location.pathname));
  const [theme, setTheme] = React.useState<Theme>(() => {
    const storedTheme = window.localStorage.getItem(themeStorageKey);

    if (storedTheme === "light" || storedTheme === "dark") {
      return storedTheme;
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });
  const [repositoryUrl, setRepositoryUrl] = React.useState("");
  const [scan, setScan] = React.useState<ScanDetail | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isCanceling, setIsCanceling] = React.useState(false);
  const [scanRequestFailure, setScanRequestFailure] = React.useState<ScanRequestFailure | null>(null);
  const [selectedRiskFilter, setSelectedRiskFilter] = React.useState<RiskFilter>("all");
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const [failedGuideScanId, setFailedGuideScanId] = React.useState<string | null>(null);
  const toastId = React.useRef(0);
  React.useEffect(() => {
    document.title = t("app.documentTitle");
    document.documentElement.lang = "en";
  }, [t]);

  React.useEffect(() => {
    const syncRoute = () => setRoute(parseRoute(window.location.pathname));

    window.addEventListener("popstate", syncRoute);

    return () => window.removeEventListener("popstate", syncRoute);
  }, []);

  React.useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem(themeStorageKey, theme);
  }, [theme]);

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
      setScanRequestFailure(null);
      setRepositoryUrl(latestScan.target);
      persistLastScan(latestScan);
    };

    void restoreScan();

    return () => {
      isMounted = false;
    };
  }, []);

  React.useEffect(() => {
    if (route.name !== "migration-guide" || scan?.id === route.scanId) {
      return;
    }

    let isMounted = true;

    const loadGuideScan = async () => {
      setFailedGuideScanId(null);
      const nextScan = await fetchScan(route.scanId).catch(() => null);

      if (!isMounted) {
        return;
      }

      if (!nextScan) {
        setFailedGuideScanId(route.scanId);
        return;
      }

      setScan(nextScan);
      setScanRequestFailure(null);
      setRepositoryUrl(nextScan.target);
      persistLastScan(nextScan);
    };

    void loadGuideScan();

    return () => {
      isMounted = false;
    };
  }, [route, scan?.id]);

  React.useEffect(() => {
    if (!scan) {
      return;
    }

    persistLastScan(scan);
  }, [scan]);

  React.useEffect(() => {
    if (!scan || (scan.status !== "running" && scan.status !== "pending")) {
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

        if (updatedScan.status === "canceled") {
          pushToast(t("toasts.scanCanceled"), "info");
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
    const target = repositoryUrl.trim();
    setIsLoading(true);
    setScan(null);
    setScanRequestFailure(null);
    setSelectedRiskFilter("all");
    window.localStorage.removeItem(lastScanStorageKey);
    window.localStorage.setItem(lastRepositoryUrlStorageKey, target);

    try {
      const nextScan = await createRepositoryScan(target);
      setScan(nextScan);
      setScanRequestFailure(null);
      persistLastScan(nextScan);
      pushToast(t("toasts.scanStarted"), "info");
    } catch (error) {
      setScanRequestFailure({
        target,
        message: error instanceof Error ? error.message : t("summary.requestFailedFallback")
      });
      pushToast(t("toasts.scanRequestFailed"), "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelScan = async () => {
    if (!scan || (scan.status !== "running" && scan.status !== "pending")) {
      return;
    }

    setIsCanceling(true);

    try {
      const canceledScan = await cancelScan(scan.id);
      setScan(canceledScan);
      persistLastScan(canceledScan);
      pushToast(t("toasts.scanCanceled"), "info");
    } catch (error) {
      pushToast(t("toasts.scanCancelFailed"), "error");
    } finally {
      setIsCanceling(false);
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

  const showSignInUnavailable = () => {
    pushToast(t("toasts.signInUnavailable"), "info");
  };

  const openMigrationGuide = (recommendationId: string) => {
    if (!scan) {
      return;
    }

    const nextPath = `/migration-plan/${scan.id}/${recommendationId}`;
    window.history.pushState(null, "", nextPath);
    setRoute({ name: "migration-guide", scanId: scan.id, recommendationId });
    window.scrollTo({ top: 0 });
  };

  const returnToDashboard = () => {
    window.history.pushState(null, "", "/");
    setRoute({ name: "dashboard" });
    window.scrollTo({ top: 0 });
  };

  const openAlgorithmDocs = (target: string) => {
    const nextPath = `/docs/algorithms/${encodeURIComponent(slugifyAlgorithmTarget(target))}`;
    const returnTo =
      route.name === "migration-guide"
        ? { scanId: route.scanId, recommendationId: route.recommendationId }
        : route.name === "algorithm-docs"
          ? route.returnTo
        : undefined;

    window.history.pushState(null, "", nextPath);
    setRoute({ name: "algorithm-docs", target, returnTo });
    window.scrollTo({ top: 0 });
  };

  const returnFromAlgorithmDocs = () => {
    if (route.name === "algorithm-docs" && route.returnTo) {
      const nextPath = `/migration-plan/${route.returnTo.scanId}/${route.returnTo.recommendationId}`;
      window.history.pushState(null, "", nextPath);
      setRoute({ name: "migration-guide", scanId: route.returnTo.scanId, recommendationId: route.returnTo.recommendationId });
    } else {
      window.history.pushState(null, "", "/");
      setRoute({ name: "dashboard" });
    }

    window.scrollTo({ top: 0 });
  };

  const selectRiskFilter = (risk: RiskFilter) => {
    setSelectedRiskFilter(risk);
    window.setTimeout(() => {
      document.getElementById("findings-table")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  const activeRecommendation =
    route.name === "migration-guide" && scan?.id === route.scanId
      ? scan.recommendations.find((recommendation) => recommendation.id === route.recommendationId) ?? null
      : null;
  const isGuideLoading = route.name === "migration-guide" && scan?.id !== route.scanId && failedGuideScanId !== route.scanId;

  return (
    <main className="app-shell">
      <TopMenu theme={theme} onThemeChange={setTheme} onHome={returnToDashboard} onSignInUnavailable={showSignInUnavailable} />
      {route.name === "algorithm-docs" ? (
        <>
          <AlgorithmDocsPage
            target={route.target}
            backLabel={route.returnTo ? t("algorithmDocs.backToGuide") : t("algorithmDocs.backToDashboard")}
            onOpenTopic={openAlgorithmDocs}
            onBack={returnFromAlgorithmDocs}
          />
          <ToastStack toasts={toasts} onDismiss={dismissToast} />
        </>
      ) : route.name === "migration-guide" ? (
        isGuideLoading ? (
          <>
            <section className="panel guide-missing">
              <p className="eyebrow">{t("migrationGuide.eyebrow")}</p>
              <h1>{t("migrationGuide.loadingTitle")}</h1>
              <p>{t("migrationGuide.loadingDescription")}</p>
            </section>
            <ToastStack toasts={toasts} onDismiss={dismissToast} />
          </>
        ) : activeRecommendation && scan ? (
          <>
            <MigrationGuidePage
              recommendation={activeRecommendation}
              scan={scan}
              onBack={returnToDashboard}
              onOpenAlgorithmDocs={openAlgorithmDocs}
              onSignInUnavailable={showSignInUnavailable}
            />
            <ToastStack toasts={toasts} onDismiss={dismissToast} />
          </>
        ) : (
          <>
            <section className="panel guide-missing">
              <p className="eyebrow">{t("migrationGuide.eyebrow")}</p>
              <h1>{t("migrationGuide.notFoundTitle")}</h1>
              <p>{t("migrationGuide.notFoundDescription")}</p>
              <button type="button" onClick={returnToDashboard}>{t("migrationGuide.back")}</button>
            </section>
            <ToastStack toasts={toasts} onDismiss={dismissToast} />
          </>
        )
      ) : (
        <Dashboard
          scan={scan}
          scanRequestFailure={scanRequestFailure}
          repositoryUrl={repositoryUrl}
          isLoading={isLoading}
          onOpenGuide={openMigrationGuide}
          onOpenAlgorithmDocs={openAlgorithmDocs}
          onRepositoryUrlChange={setRepositoryUrl}
          onRunScan={runScan}
          onCancelScan={handleCancelScan}
          onSignInUnavailable={showSignInUnavailable}
          isCanceling={isCanceling}
          selectedRiskFilter={selectedRiskFilter}
          onRiskSelect={selectRiskFilter}
          onRiskFilterChange={setSelectedRiskFilter}
          toasts={toasts}
          onDismissToast={dismissToast}
        />
      )}
    </main>
  );
}

function Dashboard({
  scan,
  scanRequestFailure,
  repositoryUrl,
  isLoading,
  onOpenGuide,
  onOpenAlgorithmDocs,
  onRepositoryUrlChange,
  onRunScan,
  onCancelScan,
  onSignInUnavailable,
  isCanceling,
  selectedRiskFilter,
  onRiskSelect,
  onRiskFilterChange,
  toasts,
  onDismissToast
}: {
  scan: ScanDetail | null;
  scanRequestFailure: ScanRequestFailure | null;
  repositoryUrl: string;
  isLoading: boolean;
  onOpenGuide: (recommendationId: string) => void;
  onOpenAlgorithmDocs: (target: string) => void;
  onRepositoryUrlChange: (repositoryUrl: string) => void;
  onRunScan: () => void;
  onCancelScan: () => void;
  onSignInUnavailable: () => void;
  isCanceling: boolean;
  selectedRiskFilter: RiskFilter;
  onRiskSelect: (risk: RiskLevel) => void;
  onRiskFilterChange: (risk: RiskFilter) => void;
  toasts: Toast[];
  onDismissToast: (id: number) => void;
}) {
  return (
    <>
      <Hero />
      <ScanForm
        repositoryUrl={repositoryUrl}
        scan={scan}
        isLoading={isLoading}
        onRepositoryUrlChange={onRepositoryUrlChange}
        onRunScan={onRunScan}
      />
      <SummaryPanel
        scan={scan}
        requestFailure={scanRequestFailure}
        isSubmitting={isLoading}
        isCanceling={isCanceling}
        onCancelScan={onCancelScan}
        onSignInUnavailable={onSignInUnavailable}
      />
      <section className="dashboard-grid">
        <RiskDistribution summary={scan?.riskSummary ?? null} selectedRisk={selectedRiskFilter} onRiskSelect={onRiskSelect} />
        <MigrationPlanPanel
          recommendations={scan?.recommendations ?? []}
          onOpenGuide={onOpenGuide}
          onOpenAlgorithmDocs={onOpenAlgorithmDocs}
        />
      </section>
      <FindingsTable
        findings={scan?.findings ?? []}
        repositoryUrl={scan?.target ?? null}
        defaultBranch={scan?.repositoryDefaultBranch ?? null}
        isScanCompleted={scan?.status === "completed"}
        selectedRisk={selectedRiskFilter}
        onRiskFilterChange={onRiskFilterChange}
      />
      <AppFooter />
      <ToastStack toasts={toasts} onDismiss={onDismissToast} />
    </>
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

function parseRoute(pathname: string): Route {
  const docsMatch = pathname.match(/^\/docs\/algorithms\/([^/]+)\/?$/);

  if (docsMatch) {
    return {
      name: "algorithm-docs",
      target: deslugifyAlgorithmTarget(decodeURIComponent(docsMatch[1]))
    };
  }

  const match = pathname.match(/^\/migration-plan\/([^/]+)\/([^/]+)\/?$/);

  if (!match) {
    return { name: "dashboard" };
  }

  return {
    name: "migration-guide",
    scanId: decodeURIComponent(match[1]),
    recommendationId: decodeURIComponent(match[2])
  };
}

function slugifyAlgorithmTarget(target: string) {
  return target.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "overview";
}

function deslugifyAlgorithmTarget(slug: string) {
  const knownTargets: Record<string, string> = {
    overview: "Overview",
    "ml-kem": "ML-KEM",
    "ml-dsa-slh-dsa": "ML-DSA / SLH-DSA",
    "aes-256-sha-384": "AES-256 / SHA-384+",
    "deprecated-algorithms": "Deprecated algorithms",
    "hybrid-rollout": "Hybrid rollout"
  };

  if (knownTargets[slug]) {
    return knownTargets[slug];
  }

  return slug.split("-").filter(Boolean).map((part) => part.toUpperCase()).join("-");
}

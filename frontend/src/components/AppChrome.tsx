import { t } from "../i18n";

type Theme = "light" | "dark";

type TopMenuProps = {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  onHome: () => void;
  onSignInUnavailable: () => void;
};

export function TopMenu({ theme, onThemeChange, onHome, onSignInUnavailable }: TopMenuProps) {
  return (
    <nav className="top-menu" aria-label={t("nav.ariaLabel")}>
      <button type="button" className="top-menu-brand" aria-label={t("nav.home")} onClick={onHome}>
        <span className="brand-mark">
          <img className="brand-logo" src="/favicon.png" alt="" aria-hidden="true" />
          QMI
        </span>
        <span>{t("hero.title")}</span>
      </button>
      <div className="top-menu-actions">
        <div className="theme-control" aria-label={t("nav.theme")}>
          <button type="button" aria-label={t("nav.lightTheme")} aria-pressed={theme === "light"} onClick={() => onThemeChange("light")}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="4.5" />
              <path d="M12 3v1.7M12 19.3V21M4.2 4.2l1.2 1.2M18.6 18.6l1.2 1.2M3 12h1.7M19.3 12H21M4.2 19.8l1.2-1.2M18.6 5.4l1.2-1.2" />
            </svg>
          </button>
          <button type="button" aria-label={t("nav.darkTheme")} aria-pressed={theme === "dark"} onClick={() => onThemeChange("dark")}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M18.7 14.5A7.2 7.2 0 0 1 9.5 5.3 7.4 7.4 0 1 0 18.7 14.5Z" />
            </svg>
          </button>
        </div>
        <button type="button" className="menu-button sign-in" onClick={onSignInUnavailable}>
          {t("nav.signIn")}
        </button>
      </div>
    </nav>
  );
}

export function Hero() {
  return (
    <header className="hero">
      <div className="hero-title-block">
        <h1>
          <span>{t("hero.eyebrow")}</span>
          <span>{t("hero.eyebrowContinuation")}</span>
        </h1>
        <div className="title-motion-bar" aria-hidden="true" />
      </div>
      <div className="hero-copy">
        <p className="hero-kicker">{t("hero.kicker")}</p>
        <p>{t("hero.description")}</p>
      </div>
    </header>
  );
}

export function AppFooter() {
  return (
    <footer className="app-footer">
      <span>{t("footer.ecosystemIntent")}</span>
      <span className="footer-logos" aria-label={t("footer.logosLabel")}>
        <img src="/brand-assets/google-logo.png" alt={t("footer.googleLogoAlt")} />
        <span className="logo-link-mark" aria-hidden="true">
          {t("footer.linkMark")}
        </span>
        <img className="virustotal-logo" src="/brand-assets/virustotal-logo.png" alt={t("footer.virustotalLogoAlt")} />
      </span>
    </footer>
  );
}

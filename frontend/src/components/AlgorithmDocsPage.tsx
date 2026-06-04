import { t } from "../i18n";

const algorithmTopics = [
  "ML-KEM",
  "ML-DSA / SLH-DSA",
  "AES-256 / SHA-384+",
  "Deprecated algorithms",
  "Hybrid rollout"
];

type AlgorithmDocsPageProps = {
  target: string;
  backLabel: string;
  onOpenTopic: (target: string) => void;
  onBack: () => void;
};

export function AlgorithmDocsPage({ target, backLabel, onOpenTopic, onBack }: AlgorithmDocsPageProps) {
  const isOverview = target.toLowerCase() === "overview";
  const isMlKem = target === "ML-KEM";

  return (
    <section className="panel algorithm-docs-page" aria-label={t("algorithmDocs.ariaLabel")}>
      <button type="button" className="back-button" onClick={onBack}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M15 6 9 12l6 6" />
          <path d="M10 12h10" />
        </svg>
        {backLabel}
      </button>
      <div className="algorithm-docs-layout">
        <aside className="algorithm-docs-index" aria-label={t("algorithmDocs.indexTitle")}>
          <span>{t("algorithmDocs.indexTitle")}</span>
          {algorithmTopics.map((topic) => (
            <button key={topic} type="button" className={topic === target ? "active" : ""} onClick={() => onOpenTopic(topic)}>
              {topic}
            </button>
          ))}
        </aside>
        <div className="algorithm-docs-content">
          <p className="eyebrow">{t("algorithmDocs.eyebrow")}</p>
          <h1>{isOverview ? t("algorithmDocs.overviewTitle") : target}</h1>
          <div className="guide-title-bar" aria-hidden="true" />
          {isMlKem ? <MlKemDocs /> : <AlgorithmDocsPlaceholder isOverview={isOverview} />}
        </div>
      </div>
    </section>
  );
}

function AlgorithmDocsPlaceholder({ isOverview }: { isOverview: boolean }) {
  return (
    <>
      <p>{isOverview ? t("algorithmDocs.overviewDescription") : t("algorithmDocs.placeholder")}</p>
      <div className="algorithm-docs-placeholder">
        <strong>{t("algorithmDocs.contentComingTitle")}</strong>
        <p>{t("algorithmDocs.contentComingDescription")}</p>
      </div>
    </>
  );
}

function MlKemDocs() {
  const flow = [
    {
      title: t("algorithmDocs.mlKem.flow.keygen.title"),
      body: t("algorithmDocs.mlKem.flow.keygen.body")
    },
    {
      title: t("algorithmDocs.mlKem.flow.encapsulation.title"),
      body: t("algorithmDocs.mlKem.flow.encapsulation.body")
    },
    {
      title: t("algorithmDocs.mlKem.flow.decapsulation.title"),
      body: t("algorithmDocs.mlKem.flow.decapsulation.body")
    }
  ];
  const parameters = [
    {
      name: t("algorithmDocs.mlKem.parameters.p512.name"),
      level: t("algorithmDocs.mlKem.parameters.p512.level"),
      guidance: t("algorithmDocs.mlKem.parameters.p512.guidance")
    },
    {
      name: t("algorithmDocs.mlKem.parameters.p768.name"),
      level: t("algorithmDocs.mlKem.parameters.p768.level"),
      guidance: t("algorithmDocs.mlKem.parameters.p768.guidance")
    },
    {
      name: t("algorithmDocs.mlKem.parameters.p1024.name"),
      level: t("algorithmDocs.mlKem.parameters.p1024.level"),
      guidance: t("algorithmDocs.mlKem.parameters.p1024.guidance")
    }
  ];
  const reviewChecklist = [
    t("algorithmDocs.mlKem.sections.review.item1"),
    t("algorithmDocs.mlKem.sections.review.item2"),
    t("algorithmDocs.mlKem.sections.review.item3"),
    t("algorithmDocs.mlKem.sections.review.item4")
  ];

  return (
    <div className="algorithm-topic">
      <p>{t("algorithmDocs.mlKem.summary")}</p>
      <p>{t("algorithmDocs.mlKem.introNote")}</p>
      <a className="algorithm-source-link" href={t("algorithmDocs.mlKem.sourceUrl")} target="_blank" rel="noreferrer">
        {t("algorithmDocs.mlKem.source")}
      </a>
      <section className="algorithm-doc-section">
        <h2>{t("algorithmDocs.mlKem.flowTitle")}</h2>
        <div className="algorithm-flow">
          {flow.map((step) => (
            <article key={step.title} className="algorithm-flow-step">
              <strong>{step.title}</strong>
              <p>{step.body}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="algorithm-doc-section">
        <h2>{t("algorithmDocs.mlKem.parametersTitle")}</h2>
        <div className="algorithm-parameter-grid">
          {parameters.map((parameter) => (
            <article key={parameter.name} className="algorithm-parameter-card">
              <strong>{parameter.name}</strong>
              <span>{parameter.level}</span>
              <p>{parameter.guidance}</p>
            </article>
          ))}
        </div>
      </section>
      <div className="algorithm-topic-grid compact">
        <AlgorithmDocSection title={t("algorithmDocs.mlKem.sections.what.title")} body={t("algorithmDocs.mlKem.sections.what.body")} />
        <AlgorithmDocSection title={t("algorithmDocs.mlKem.sections.use.title")} body={t("algorithmDocs.mlKem.sections.use.body")} />
        <AlgorithmDocSection title={t("algorithmDocs.mlKem.sections.migrate.title")} body={t("algorithmDocs.mlKem.sections.migrate.body")} />
        <section className="algorithm-doc-card">
          <h2>{t("algorithmDocs.mlKem.sections.review.title")}</h2>
          <ul>
            {reviewChecklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>
      <section className="algorithm-doc-section">
        <h2>{t("algorithmDocs.mlKem.ecosystemTitle")}</h2>
        <p>{t("algorithmDocs.mlKem.ecosystem")}</p>
        <div className="algorithm-source-list">
          <a href={t("algorithmDocs.mlKem.ecosystemSources.opensslUrl")} target="_blank" rel="noreferrer">
            {t("algorithmDocs.mlKem.ecosystemSources.openssl")}
          </a>
          <a href={t("algorithmDocs.mlKem.ecosystemSources.goUrl")} target="_blank" rel="noreferrer">
            {t("algorithmDocs.mlKem.ecosystemSources.go")}
          </a>
          <a href={t("algorithmDocs.mlKem.ecosystemSources.awslcUrl")} target="_blank" rel="noreferrer">
            {t("algorithmDocs.mlKem.ecosystemSources.awslc")}
          </a>
        </div>
      </section>
    </div>
  );
}

function AlgorithmDocSection({ title, body }: { title: string; body: string }) {
  return (
    <section className="algorithm-doc-card">
      <h2>{title}</h2>
      <p>{body}</p>
    </section>
  );
}

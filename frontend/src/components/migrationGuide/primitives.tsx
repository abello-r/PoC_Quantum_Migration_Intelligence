import type { ReactNode } from "react";

export function BriefMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="brief-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function StatusMetric({
  icon,
  label,
  value,
  tone = "neutral"
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone?: "neutral" | "warning" | "danger" | "primary";
}) {
  return (
    <div className={`status-metric ${tone}`}>
      <span className="status-metric-icon" aria-hidden="true">{icon}</span>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

export function ConsoleCard({
  eyebrow,
  title,
  tone,
  className,
  children
}: {
  eyebrow: string;
  title: string;
  tone?: "action";
  className?: string;
  children: ReactNode;
}) {
  const classes = ["console-card", tone, className].filter(Boolean).join(" ");

  return (
    <article className={classes}>
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      {children}
    </article>
  );
}

export function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="fact-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

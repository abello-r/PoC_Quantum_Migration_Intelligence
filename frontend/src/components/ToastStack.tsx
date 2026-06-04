import { t } from "../i18n";

export type Toast = {
  id: number;
  message: string;
  tone: "success" | "error" | "info";
};

type ToastStackProps = {
  toasts: Toast[];
  onDismiss: (id: number) => void;
};

export function ToastStack({ toasts, onDismiss }: ToastStackProps) {
  return (
    <div className="toast-stack" aria-live="polite" aria-label={t("toasts.notifications")}>
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast ${toast.tone}`}>
          <div className="toast-content">
            <span>{toast.message}</span>
            <button type="button" aria-label={t("toasts.dismiss")} onClick={() => onDismiss(toast.id)}>
              x
            </button>
          </div>
          <div className="toast-progress" />
        </div>
      ))}
    </div>
  );
}

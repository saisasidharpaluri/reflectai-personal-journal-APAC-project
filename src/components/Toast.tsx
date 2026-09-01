import React from "react";
import { ToastMessage } from "../types";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      id="toast-container"
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none"
    >
      {toasts.map((toast) => {
        const isError = toast.type === "error";
        const isSuccess = toast.type === "success";

        return (
          <div
            key={toast.id}
            id={`toast-${toast.id}`}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg border backdrop-blur-md transition-all duration-200 animate-in fade-in slide-in-from-bottom-3 ${
              isError
                ? "bg-rose-50 border-rose-200 text-rose-950 dark:bg-rose-950/90 dark:border-rose-800 dark:text-rose-100"
                : isSuccess
                ? "bg-emerald-50 border-emerald-200 text-emerald-950 dark:bg-emerald-950/90 dark:border-emerald-800 dark:text-emerald-100"
                : "bg-slate-50 border-slate-200 text-slate-900 dark:bg-slate-900/90 dark:border-slate-800 dark:text-slate-100"
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {isError ? (
                <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              ) : isSuccess ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Info className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              )}
            </div>

            <div className="flex-1 text-sm font-medium leading-relaxed">
              <p>{toast.message}</p>
              {toast.actionLabel && toast.onAction && (
                <button
                  type="button"
                  onClick={toast.onAction}
                  className="mt-2 text-xs font-semibold underline hover:opacity-80 transition cursor-pointer"
                >
                  {toast.actionLabel}
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition p-1"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

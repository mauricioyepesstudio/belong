"use client";

import { cn } from "@/lib/utils";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Check, AlertCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

type Toast = {
  id: string;
  message: string;
  type: ToastType;
  action?: { label: string; onClick: () => void };
  details?: {
    title?: string;
    avatarUrl?: string | null;
    avatarFallback?: string;
  };
};

type ToastContextValue = {
  toast: (message: string, type?: ToastType, action?: Toast["action"], details?: Toast["details"]) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const icons = {
  success: Check,
  error: AlertCircle,
  info: Info,
};

const styles = {
  success: "border-success/20 bg-success/10 text-success",
  error: "border-error/20 bg-error/10 text-error",
  info: "border-info/20 bg-info/10 text-info",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const reducedMotion = useReducedMotion();
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = "info", action?: Toast["action"], details?: Toast["details"]) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type, action, details }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-20 right-4 z-[100] flex flex-col gap-2 lg:bottom-6">
        <AnimatePresence>
          {toasts.map((t) => {
            const Icon = icons[t.type];
            return (
              <motion.div
                key={t.id}
                initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.25, ease: [0.21, 0.47, 0.32, 0.98] }}
                role={t.type === "error" ? "alert" : "status"}
                aria-live={t.type === "error" ? "assertive" : "polite"}
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-xl min-w-[280px] max-w-sm",
                  styles[t.type]
                )}
              >
                {t.details?.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- transient remote profile image
                  <img src={t.details.avatarUrl} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
                ) : t.details?.avatarFallback ? (
                  <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-semibold text-brand">
                    {t.details.avatarFallback}
                  </span>
                ) : (
                  <Icon className="h-4 w-4 shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  {t.details?.title && <p className="text-sm font-semibold text-fg-primary">{t.details.title}</p>}
                  <p className="line-clamp-2 text-sm font-medium text-fg-primary">{t.message}</p>
                </div>
                {t.action && <button type="button" className="rounded-lg px-2 py-1 text-xs font-semibold text-brand hover:bg-brand/10 focus-ring" onClick={() => { t.action?.onClick(); dismiss(t.id); }}>{t.action.label}</button>}
                <button
                  type="button"
                  onClick={() => dismiss(t.id)}
                  className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
                  aria-label="Dismiss"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

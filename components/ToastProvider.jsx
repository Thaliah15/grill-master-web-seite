"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((t) => {
    const id = Math.random().toString(36).slice(2);
    const toast = { id, type: t.type || "success", title: t.title || "", message: t.message || "" };
    setToasts((prev) => [...prev, toast]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), t.durationMs || 2500);
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-[60] space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={
              "w-[320px] rounded-3xl border bg-white p-4 shadow-soft " +
              (t.type === "error" ? "border-rose-200" : "border-gray-200")
            }
          >
            {t.title ? <div className="font-bold">{t.title}</div> : null}
            {t.message ? <div className="text-sm text-gray-600">{t.message}</div> : null}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) return { push: () => null };
  return ctx;
}

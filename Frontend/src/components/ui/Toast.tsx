"use client";

import { useState, useCallback, useEffect, type JSX } from "react";

/* ================= TYPES ================= */

type ToastType = "success" | "error" | "warning" | "info";

interface ToastItem {
  id: number;
  type: ToastType;
  title?: string;
  message?: string;
  duration?: number;
}

/* ================= CONFIG ================= */

const icons: Record<ToastType, JSX.Element> = {
  success: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 10.5L8.5 13L14 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  error: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 7L13 13M13 7L7 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  warning: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 3L18 17H2L10 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M10 8V11.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="10" cy="14.5" r="0.8" fill="currentColor" />
    </svg>
  ),
  info: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 9V14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="10" cy="6.5" r="0.8" fill="currentColor" />
    </svg>
  ),
};

const toastConfig: Record<ToastType, { bg: string; border: string; accent: string; text: string; label: string }> = {
  success: { bg: "#0f1a12", border: "#1e4d2b", accent: "#22c55e", text: "#86efac", label: "Success"  },
  error:   { bg: "#1a0f0f", border: "#4d1e1e", accent: "#ef4444", text: "#fca5a5", label: "Error"    },
  warning: { bg: "#1a160f", border: "#4d3a1e", accent: "#f59e0b", text: "#fcd34d", label: "Warning"  },
  info:    { bg: "#0f1420", border: "#1e304d", accent: "#3b82f6", text: "#93c5fd", label: "Info"     },
};

/* ================= SINGLE TOAST ================= */

function Toast({ id, type = "success", title, message, duration = 4000, onRemove }: ToastItem & { onRemove: (id: number) => void }) {
  const [visible, setVisible]   = useState(false);
  const [exiting, setExiting]   = useState(false);
  const [progress, setProgress] = useState(100);
  const cfg = toastConfig[type];

  const dismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => onRemove(id), 350);
  }, [id, onRemove]);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(pct);
      if (pct === 0) clearInterval(interval);
    }, 16);
    const timer = setTimeout(dismiss, duration);
    return () => { clearTimeout(timer); clearInterval(interval); };
  }, [duration, dismiss]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        borderRadius: "12px",
        overflow: "hidden",
        width: "100%",
        boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${cfg.border}`,
        transform: visible && !exiting ? "translateX(0) scale(1)" : "translateX(110%) scale(0.95)",
        opacity: visible && !exiting ? 1 : 0,
        transition: "transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease",
      }}
    >
      {/* Body */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "14px 16px" }}>
        {/* Icon */}
        <div style={{ color: cfg.accent, flexShrink: 0, marginTop: "1px", filter: `drop-shadow(0 0 6px ${cfg.accent}80)` }}>
          {icons[type]}
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "monospace", fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: cfg.accent, marginBottom: "3px" }}>
            {title || cfg.label}
          </div>
          {message && (
            <div style={{ fontSize: "13.5px", color: cfg.text, lineHeight: "1.5", opacity: 0.85 }}>
              {message}
            </div>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={dismiss}
          style={{ background: "none", border: "none", cursor: "pointer", color: cfg.text, opacity: 0.4, padding: "2px", borderRadius: "4px", display: "flex", alignItems: "center", flexShrink: 0 }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.4")}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 2L12 12M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Progress bar */}
      <div style={{ height: "2px", background: cfg.border }}>
        <div style={{ height: "100%", width: `${progress}%`, background: `linear-gradient(90deg, ${cfg.accent}80, ${cfg.accent})`, transition: "width 0.1s linear", boxShadow: `0 0 6px ${cfg.accent}` }} />
      </div>
    </div>
  );
}

/* ================= TOAST CONTAINER ================= */

function ToastContainer({ toasts, onRemove }: { toasts: ToastItem[]; onRemove: (id: number) => void }) {
  return (
    <>
      <style>{`
        .toast-container {
          position: fixed;
          top: 72px;
          right: 20px;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          gap: 10px;
          pointer-events: none;
        }
        .toast-wrapper {
          pointer-events: auto;
        }
        .toast-wrapper > div {
          min-width: 320px;
          max-width: 400px;
        }

        @media (max-width: 640px) {
          .toast-container {
            top: 64px;
            right: 12px;
            left: 12px;
          }
          .toast-wrapper > div {
            min-width: unset;
            max-width: unset;
            width: 100%;
          }
        }
      `}</style>
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className="toast-wrapper">
            <Toast {...t} onRemove={onRemove} />
          </div>
        ))}
      </div>
    </>
  );
}

/* ================= GLOBAL TRIGGER ================= */

let _addToast: ((toast: Omit<ToastItem, "id">) => void) | null = null;

/* ================= PROVIDER ================= */

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  _addToast = useCallback((toast: Omit<ToastItem, "id">) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, ...toast }]);
  }, []);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <>
      {children}
      <ToastContainer toasts={toasts} onRemove={remove} />
    </>
  );
}

/* ================= HOOK ================= */

export function useToast() {
  const fire = useCallback((type: ToastType, title?: string, message?: string, duration?: number) => {
    _addToast?.({ type, title, message, duration });
  }, []);

  return {
    success: (title?: string, message?: string, duration?: number) => fire("success", title, message, duration),
    error:   (title?: string, message?: string, duration?: number) => fire("error",   title, message, duration),
    warning: (title?: string, message?: string, duration?: number) => fire("warning", title, message, duration),
    info:    (title?: string, message?: string, duration?: number) => fire("info",    title, message, duration),
  };
}
// App-wide feedback layer: in-app toasts + a real confirm dialog.
// Replaces native alert()/confirm(), which shattered the calm, non-clinical tone.
//
// Usage:
//   const toast = useToast();        toast("Logged.", { tone: "success" });
//   const confirm = useConfirm();    if (await confirm({ title, body, tone: "danger" })) { ... }

import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { TOKENS } from "../tokens.js";
import { Check, AlertCircle, X, Sparkles } from "lucide-react";

const ToastCtx = createContext(() => {});
const ConfirmCtx = createContext(async () => false);

export const useToast = () => useContext(ToastCtx);
export const useConfirm = () => useContext(ConfirmCtx);

const TONE = {
  success: { bg: TOKENS.colors.primary, icon: Check },
  error: { bg: TOKENS.colors.doctorsTerritory, icon: AlertCircle },
  info: { bg: TOKENS.colors.primary, icon: Sparkles }
};

export function FeedbackProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [dialog, setDialog] = useState(null); // { options, resolve }
  const idRef = useRef(0);

  const toast = useCallback((message, { tone = "success", duration = 4000 } = {}) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration);
  }, []);

  const confirm = useCallback(
    (options) => new Promise((resolve) => setDialog({ options, resolve })),
    []
  );

  const closeDialog = (result) => {
    if (dialog) dialog.resolve(result);
    setDialog(null);
  };

  const opt = dialog?.options || {};
  const danger = opt.tone === "danger";

  return (
    <ToastCtx.Provider value={toast}>
      <ConfirmCtx.Provider value={confirm}>
        {children}

        {/* Toast stack */}
        <div style={{ position: "fixed", top: "18px", left: "50%", transform: "translateX(-50%)", zIndex: 3000, display: "flex", flexDirection: "column", gap: "8px", alignItems: "center", pointerEvents: "none" }}>
          {toasts.map((tt) => {
            const Icon = (TONE[tt.tone] || TONE.info).icon;
            return (
              <div
                key={tt.id}
                role="status"
                style={{
                  background: (TONE[tt.tone] || TONE.info).bg,
                  color: "#fff",
                  padding: "12px 22px",
                  borderRadius: TOKENS.borderRadius.pill,
                  boxShadow: TOKENS.shadows.float,
                  fontSize: "14px",
                  fontWeight: 500,
                  fontFamily: TOKENS.fonts.data,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  maxWidth: "90vw",
                  animation: "aaToastIn 0.28s cubic-bezier(0.16,1,0.3,1)"
                }}
              >
                <Icon size={16} style={{ flexShrink: 0 }} />
                <span>{tt.message}</span>
              </div>
            );
          })}
        </div>

        {/* Confirm dialog */}
        {dialog && (
          <div
            onClick={() => closeDialog(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(26,37,30,0.42)", backdropFilter: "blur(4px)", zIndex: 3100, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              role="alertdialog"
              aria-modal="true"
              style={{
                width: "100%",
                maxWidth: "380px",
                background: TOKENS.colors.surface,
                borderRadius: TOKENS.borderRadius.lg,
                padding: "24px",
                boxShadow: TOKENS.shadows.elevated,
                fontFamily: TOKENS.fonts.data,
                color: TOKENS.colors.textDark,
                animation: "aaDialogIn 0.24s cubic-bezier(0.16,1,0.3,1)"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 600 }}>{opt.title}</h3>
                <button onClick={() => closeDialog(false)} aria-label="Close" style={{ background: "none", border: "none", color: TOKENS.colors.textMuted, cursor: "pointer", padding: 0 }}>
                  <X size={18} />
                </button>
              </div>
              {opt.body && (
                <p style={{ margin: "10px 0 0", fontSize: "14px", color: TOKENS.colors.textMuted, lineHeight: 1.5 }}>{opt.body}</p>
              )}
              <div style={{ display: "flex", gap: "10px", marginTop: "22px" }}>
                <button
                  className="aa-btn"
                  onClick={() => closeDialog(false)}
                  style={{ flex: 1, padding: "12px", fontSize: "14px", fontWeight: 600, background: TOKENS.colors.surface, color: TOKENS.colors.textDark, boxShadow: `inset 0 0 0 1px ${TOKENS.colors.border}`, fontFamily: TOKENS.fonts.data }}
                >
                  {opt.cancelLabel || "Cancel"}
                </button>
                <button
                  className="aa-btn"
                  onClick={() => closeDialog(true)}
                  style={{ flex: 1, padding: "12px", fontSize: "14px", fontWeight: 600, background: danger ? TOKENS.colors.doctorsTerritory : TOKENS.colors.primary, color: "#fff", fontFamily: TOKENS.fonts.data }}
                >
                  {opt.confirmLabel || "Confirm"}
                </button>
              </div>
            </div>
          </div>
        )}

        <style>{`
          @keyframes aaToastIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes aaDialogIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
        `}</style>
      </ConfirmCtx.Provider>
    </ToastCtx.Provider>
  );
}

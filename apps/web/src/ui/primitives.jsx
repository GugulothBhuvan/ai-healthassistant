// Shared UI primitives — the component layer that replaces per-screen inline
// style duplication. Themed from TOKENS; interaction states live in index.css
// (.aa-btn / .aa-skeleton) so hover/active/focus-visible are consistent.

import React from "react";
import { TOKENS } from "../tokens.js";

// Bounded surface. Replaces the cardStyle object each screen used to redefine.
export function Card({ children, style = {}, ...props }) {
  return (
    <div
      style={{
        background: TOKENS.colors.surface,
        borderRadius: TOKENS.borderRadius.card,
        padding: "20px",
        boxShadow: TOKENS.shadows.card,
        border: `1px solid ${TOKENS.colors.border}`,
        marginBottom: "16px",
        fontFamily: TOKENS.fonts.data,
        ...style
      }}
      {...props}
    >
      {children}
    </div>
  );
}

const BUTTON_VARIANTS = {
  primary: { background: TOKENS.colors.primary, color: "#ffffff" },
  accent: { background: TOKENS.colors.accent, color: TOKENS.colors.accentInk },
  secondary: {
    background: TOKENS.colors.surface,
    color: TOKENS.colors.textDark,
    boxShadow: `inset 0 0 0 1px ${TOKENS.colors.border}`
  },
  ghost: {
    background: "transparent",
    color: TOKENS.colors.textMuted,
    boxShadow: `inset 0 0 0 1px ${TOKENS.colors.border}`
  },
  danger: {
    background: "#FFF5F5",
    color: TOKENS.colors.doctorsTerritory,
    boxShadow: `inset 0 0 0 1px ${TOKENS.colors.doctorsTerritory}30`
  }
};

const BUTTON_SIZES = {
  sm: { padding: "8px 14px", fontSize: "13px" },
  md: { padding: "12px 20px", fontSize: "14px" },
  lg: { padding: "15px 22px", fontSize: "15px" }
};

// Themed button with real hover/active/focus states (via .aa-btn).
export function Button({
  variant = "primary",
  size = "md",
  full = false,
  style = {},
  children,
  ...props
}) {
  return (
    <button
      className="aa-btn"
      style={{
        fontFamily: TOKENS.fonts.data,
        fontWeight: 600,
        width: full ? "100%" : undefined,
        ...BUTTON_SIZES[size],
        ...BUTTON_VARIANTS[variant],
        ...style
      }}
      {...props}
    >
      {children}
    </button>
  );
}

// Loading placeholder — structure-preserving instead of a text flash.
export function Skeleton({ width = "100%", height = 16, style = {} }) {
  return <div className="aa-skeleton" style={{ width, height, ...style }} />;
}

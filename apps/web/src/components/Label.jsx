// Label badge component for status indicators

import React from "react";
import { TOKENS } from "../tokens.js";

/**
 * Renders a stylized text badge tag based on the classification.
 */
export function Label({ text, type = "default", style = {} }) {
  const getColors = () => {
    switch (type) {
      case "food_fixable":
        return {
          bg: `${TOKENS.colors.foodFixable}15`,
          color: TOKENS.colors.foodFixable
        };
      case "doctors_territory":
        return {
          bg: `${TOKENS.colors.doctorsTerritory}15`,
          color: TOKENS.colors.doctorsTerritory
        };
      case "both":
        return {
          bg: `${TOKENS.colors.both}15`,
          color: TOKENS.colors.both
        };
      case "primary":
        return {
          bg: TOKENS.colors.primaryLight,
          color: TOKENS.colors.primary
        };
      case "low":
        return {
          bg: `${TOKENS.colors.foodFixable}15`,
          color: TOKENS.colors.foodFixable
        };
      case "high":
        return {
          bg: `${TOKENS.colors.doctorsTerritory}15`,
          color: TOKENS.colors.doctorsTerritory
        };
      default:
        return {
          bg: "#E8E6E0",
          color: TOKENS.colors.textDark
        };
    }
  };

  const colors = getColors();

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 8px",
        borderRadius: TOKENS.borderRadius.badge,
        fontSize: "11px",
        fontWeight: 600,
        background: colors.bg,
        color: colors.color,
        fontFamily: TOKENS.fonts.data,
        textTransform: "capitalize",
        whiteSpace: "nowrap",
        ...style
      }}
    >
      {text}
    </span>
  );
}
export default Label;

// RangeBar component: shows a value marker on a target range/reference band

import React from "react";
import { TOKENS } from "../tokens.js";

/**
 * Renders a horizontal bar representing either:
 * 1. A reference range with normal limits and a current value marker.
 * 2. A progress target bar (e.g. daily intake vs target).
 */
export function RangeBar({ 
  value = 0, 
  target = 0, 
  rangeLow = 0, 
  rangeHigh = 0, 
  unit = "", 
  isProgress = false 
}) {
  const clamp = (val, low, high) => Math.max(low, Math.min(high, val));
  
  if (isProgress) {
    const pct = clamp((value / (target || 1)) * 100, 0, 100);
    const progressColor = value > target ? TOKENS.colors.foodFixable : TOKENS.colors.primary;
    
    return (
      <div style={{ fontFamily: TOKENS.fonts.data, margin: "10px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}>
          <span style={{ color: TOKENS.colors.textDark, fontWeight: 500 }}>
            {value} / {target} {unit}
          </span>
          <span style={{ color: TOKENS.colors.textMuted }}>{Math.round(pct)}%</span>
        </div>
        <div style={{ height: "6px", background: TOKENS.colors.rangeTrackBg, borderRadius: "3px", overflow: "hidden" }}>
          <div style={{ 
            width: `${pct}%`, 
            height: "100%", 
            background: progressColor, 
            borderRadius: "3px", 
            transition: "width 0.3s ease" 
          }} />
        </div>
      </div>
    );
  }

  // Reference range bar layout
  // Scale minimum and maximum to give some visual padding around the normal band
  const minVal = rangeLow * 0.5;
  const maxVal = rangeHigh * 1.5;
  const span = maxVal - minVal || 1;
  
  const lowPct = clamp(((rangeLow - minVal) / span) * 100, 0, 100);
  const highPct = clamp(((rangeHigh - minVal) / span) * 100, 0, 100);
  const valPct = clamp(((value - minVal) / span) * 100, 0, 100);
  
  const isOutOfRange = value < rangeLow || value > rangeHigh;
  const markerColor = isOutOfRange 
    ? (value < rangeLow ? TOKENS.colors.foodFixable : TOKENS.colors.doctorsTerritory)
    : TOKENS.colors.primary;

  return (
    <div style={{ fontFamily: TOKENS.fonts.data, margin: "12px 0", width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: TOKENS.colors.textDark, marginBottom: "4px" }}>
        <span style={{ color: TOKENS.colors.textMuted, fontSize: "12px" }}>
          Ref: {rangeLow} - {rangeHigh} {unit}
        </span>
        <span style={{ fontWeight: 600, color: markerColor }}>
          {value} {unit}
        </span>
      </div>
      <div style={{
        position: "relative",
        height: "8px",
        background: TOKENS.colors.rangeTrackBg,
        borderRadius: "4px",
        margin: "8px 0"
      }}>
        {/* Highlighted green zone representing normal range */}
        <div style={{
          position: "absolute",
          left: `${lowPct}%`,
          width: `${highPct - lowPct}%`,
          height: "100%",
          background: TOKENS.colors.primaryLight,
          borderLeft: `1px solid ${TOKENS.colors.primary}`,
          borderRight: `1px solid ${TOKENS.colors.primary}`,
          opacity: 0.8
        }} />
        
        {/* Pinpoint value indicator dot */}
        <div style={{
          position: "absolute",
          left: `${valPct}%`,
          top: "50%",
          width: "12px",
          height: "12px",
          background: markerColor,
          border: "2px solid #ffffff",
          borderRadius: "50%",
          transform: "translate(-50%, -50%)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
          transition: "left 0.3s ease"
        }} />
      </div>
    </div>
  );
}
export default RangeBar;

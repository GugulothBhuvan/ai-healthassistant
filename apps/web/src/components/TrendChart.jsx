// TrendChart: smooth SVG area/line chart for the Home hero (7-day intake curve).
//
// Signature element borrowed from the reference UI (the peak-callout curve), but
// rendered on our forest-green hero and driven by real weekly data. Pure SVG —
// no chart dependency. Designed to sit on a dark hero surface.

import React, { useState } from "react";
import { TOKENS } from "../tokens.js";

// Build a smooth cubic path through points using a Catmull-Rom → Bézier spline.
function smoothPath(points) {
  if (points.length < 2) return "";
  const d = [`M ${points[0].x},${points[0].y}`];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const t = 0.18; // tension — gentle, avoids overshoot
    const c1x = p1.x + (p2.x - p0.x) * t;
    const c1y = p1.y + (p2.y - p0.y) * t;
    const c2x = p2.x - (p3.x - p1.x) * t;
    const c2y = p2.y - (p3.y - p1.y) * t;
    d.push(`C ${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`);
  }
  return d.join(" ");
}

export function TrendChart({
  data = [],            // [{ label, value }]
  highlightIndex = -1,  // index to spotlight (defaults to last)
  unit = "kcal",
  height = 150
}) {
  const [hover, setHover] = useState(-1);

  if (!data || data.length < 2) return null;

  const W = 320;
  const H = height;
  const padX = 14;
  const padTop = 34;   // room for the callout bubble
  const padBottom = 22; // room for x labels

  const values = data.map((d) => d.value);
  const maxV = Math.max(...values, 1);
  const minV = Math.min(...values, 0);
  const span = maxV - minV || 1;

  const innerW = W - padX * 2;
  const innerH = H - padTop - padBottom;

  const points = data.map((d, i) => ({
    x: padX + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW),
    y: padTop + innerH - ((d.value - minV) / span) * innerH,
    ...d
  }));

  const line = smoothPath(points);
  const area = `${line} L ${points[points.length - 1].x},${padTop + innerH} L ${points[0].x},${padTop + innerH} Z`;

  const spotIdx = hover >= 0 ? hover : (highlightIndex >= 0 ? highlightIndex : data.length - 1);
  const spot = points[spotIdx];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height={H}
      preserveAspectRatio="none"
      style={{ display: "block", overflow: "visible", fontFamily: TOKENS.fonts.data }}
      role="img"
      aria-label={`Weekly ${unit} trend`}
    >
      <defs>
        <linearGradient id="aarogyaAreaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={TOKENS.colors.chartFillTop} />
          <stop offset="100%" stopColor={TOKENS.colors.chartFillBottom} />
        </linearGradient>
      </defs>

      {/* Area + line */}
      <path d={area} fill="url(#aarogyaAreaFill)" />
      <path
        d={line}
        fill="none"
        stroke={TOKENS.colors.chartLine}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Vertical guide to the spotlighted point */}
      {spot && (
        <line
          x1={spot.x}
          y1={spot.y + 6}
          x2={spot.x}
          y2={padTop + innerH}
          stroke={TOKENS.colors.textInverseMuted}
          strokeWidth="1"
          strokeDasharray="2 3"
          opacity="0.55"
        />
      )}

      {/* Hover targets + subtle dots */}
      {points.map((p, i) => (
        <g key={i}>
          <circle
            cx={p.x}
            cy={p.y}
            r={i === spotIdx ? 5 : 2.5}
            fill={i === spotIdx ? TOKENS.colors.accent : TOKENS.colors.chartLine}
            stroke={i === spotIdx ? TOKENS.colors.primaryDeep : "none"}
            strokeWidth={i === spotIdx ? 2 : 0}
          />
          <rect
            x={p.x - innerW / (data.length * 2)}
            y={padTop}
            width={innerW / data.length}
            height={innerH}
            fill="transparent"
            style={{ cursor: "pointer" }}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(-1)}
          />
        </g>
      ))}

      {/* Callout bubble on the spotlighted point */}
      {spot && (
        <g transform={`translate(${Math.min(Math.max(spot.x, padX + 26), W - padX - 26)}, ${Math.max(spot.y - 22, 12)})`}>
          <rect x="-26" y="-13" width="52" height="22" rx="11" fill={TOKENS.colors.accent} />
          <text
            x="0"
            y="2"
            textAnchor="middle"
            fontSize="11"
            fontWeight="700"
            fill={TOKENS.colors.accentInk}
          >
            {Math.round(spot.value)} {unit}
          </text>
        </g>
      )}

      {/* X-axis labels */}
      {points.map((p, i) => (
        <text
          key={`lbl-${i}`}
          x={p.x}
          y={H - 6}
          textAnchor="middle"
          fontSize="10"
          fontWeight={i === spotIdx ? 700 : 500}
          fill={i === spotIdx ? TOKENS.colors.textInverse : TOKENS.colors.textInverseMuted}
        >
          {p.label}
        </text>
      ))}
    </svg>
  );
}

export default TrendChart;

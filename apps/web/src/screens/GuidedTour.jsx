// GuidedTour — post-onboarding spotlight walkthrough (responsive)
// Shows once after first login (stored in localStorage: aarogya_tour_seen)
// Handles mobile bottom-nav, desktop sidebar, tablets, orientation changes.

import React, { useState, useEffect, useCallback, useRef } from "react";
import { TOKENS } from "../tokens.js";
import { Mic, Camera, Plus, Heart, TrendingUp, ArrowRight } from "lucide-react";

// Each step lists multiple possible target IDs (mobile vs desktop).
// The tour picks whichever element is actually visible on screen.
const TOUR_STEPS = [
  {
    targets: ["fab-mic", "sidebar-mic"],
    icon: Mic,
    title: "Talk to Aarogya",
    body: "Tap here to speak or type. Tell us what you ate, drank, or weighed — we'll log it for you.",
  },
  {
    targets: ["btn-camera"],
    icon: Camera,
    title: "Snap a photo",
    body: "Take a photo of your food or prescription. We'll read it and log the details automatically.",
  },
  {
    targets: ["btn-add"],
    icon: Plus,
    title: "Quick add",
    body: "Type what you ate to log it manually — like \"2 roti and dal\" or \"1 glass of milk\".",
  },
  {
    targets: ["tab-health", "sidebar-health"],
    icon: Heart,
    title: "Your Health tab",
    body: "Upload your blood report here. We'll flag what's low and suggest foods to fix it.",
  },
  {
    targets: ["tab-trends", "sidebar-trends"],
    icon: TrendingUp,
    title: "See your Trends",
    body: "Track weekly nutrition patterns and watch your markers improve over time.",
  },
];

const STORAGE_KEY = "aarogya_tour_seen";
const TOOLTIP_GAP = 14; // px between spotlight ring and tooltip edge
const SPOTLIGHT_PAD = 12; // px padding around the target inside the ring
const VIEWPORT_MARGIN = 12; // px kept from viewport edges

// ── Helpers ───────────────────────────────────────────────────

/** Find the first visible element from a list of IDs */
function findVisibleTarget(ids) {
  for (const id of ids) {
    const el = document.getElementById(id);
    if (!el) continue;
    const rect = el.getBoundingClientRect();
    // "visible" = has dimensions AND is inside the viewport
    if (rect.width > 0 && rect.height > 0 &&
        rect.bottom > 0 && rect.top < window.innerHeight &&
        rect.right > 0 && rect.left < window.innerWidth) {
      return { el, rect };
    }
  }
  return null;
}

/** Clamp a value between min and max */
function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

// ── Component ────────────────────────────────────────────────

export function GuidedTour({ onComplete }) {
  const [step, setStep] = useState(0);
  const [spotlight, setSpotlight] = useState(null); // { centerX, centerY, radius }
  const [tooltipPos, setTooltipPos] = useState(null); // { top, left, maxWidth, placement }
  const [isVisible, setIsVisible] = useState(true);
  const [animKey, setAnimKey] = useState(0); // force re-animate on step change
  const tooltipRef = useRef(null);

  const current = TOUR_STEPS[step];

  // ── Measure target + compute positions ──────────────────────
  const measure = useCallback(() => {
    if (!current) return;
    const found = findVisibleTarget(current.targets);

    if (!found) {
      // Target not visible — show tooltip centered, no spotlight
      setSpotlight(null);
      setTooltipPos({ centered: true });
      return;
    }

    const { el, rect } = found;

    // Scroll the element into view if it's partially hidden
    const isPartiallyHidden =
      rect.top < 0 || rect.bottom > window.innerHeight ||
      rect.left < 0 || rect.right > window.innerWidth;
    if (isPartiallyHidden) {
      el.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
      // Re-measure after scroll settles
      setTimeout(() => measure(), 350);
      return;
    }

    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const radius = Math.max(rect.width, rect.height) / 2 + SPOTLIGHT_PAD;

    setSpotlight({ centerX: cx, centerY: cy, radius });

    // ── Smart tooltip placement ────────────────────────────────
    // Determine available space in all 4 directions
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const tooltipW = Math.min(300, vw - VIEWPORT_MARGIN * 2);
    const estimatedH = 200; // conservative estimate

    const spaceAbove = rect.top - radius - TOOLTIP_GAP;
    const spaceBelow = vh - rect.bottom - radius - TOOLTIP_GAP;
    const spaceLeft = rect.left;
    const spaceRight = vw - rect.right;

    let placement, top, left;

    // Prefer below, then above, then whichever side has more room
    if (spaceBelow >= estimatedH) {
      placement = "below";
      top = cy + radius + TOOLTIP_GAP;
    } else if (spaceAbove >= estimatedH) {
      placement = "above";
      // We'll set bottom instead of top, but store the calculated top
      top = cy - radius - TOOLTIP_GAP; // this is the BOTTOM edge of tooltip
    } else if (spaceRight >= tooltipW + TOOLTIP_GAP && spaceRight >= spaceLeft) {
      placement = "right";
      top = clamp(cy - estimatedH / 2, VIEWPORT_MARGIN, vh - estimatedH - VIEWPORT_MARGIN);
      left = rect.right + TOOLTIP_GAP;
    } else {
      placement = "left";
      top = clamp(cy - estimatedH / 2, VIEWPORT_MARGIN, vh - estimatedH - VIEWPORT_MARGIN);
      left = rect.left - tooltipW - TOOLTIP_GAP;
    }

    // For above/below: center horizontally on the target, clamped to viewport
    if (placement === "above" || placement === "below") {
      left = clamp(cx - tooltipW / 2, VIEWPORT_MARGIN, vw - tooltipW - VIEWPORT_MARGIN);
    }

    setTooltipPos({ top, left, maxWidth: tooltipW, placement, centered: false });
  }, [current]);

  // Re-measure on step change, resize, orientation, scroll
  useEffect(() => {
    // Small delay so the DOM has settled after step transitions
    const timer = setTimeout(measure, 80);

    window.addEventListener("resize", measure);
    window.addEventListener("orientationchange", measure);
    window.addEventListener("scroll", measure, true);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", measure);
      window.removeEventListener("orientationchange", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [measure, step]);

  // ── Navigation ──────────────────────────────────────────────
  const handleNext = () => {
    if (step < TOUR_STEPS.length - 1) {
      setStep(step + 1);
      setAnimKey((k) => k + 1);
    } else {
      finish();
    }
  };

  const finish = () => {
    setIsVisible(false);
    localStorage.setItem(STORAGE_KEY, "true");
    onComplete?.();
  };

  if (!isVisible || !current) return null;

  const StepIcon = current.icon;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // ── Tooltip inline style ────────────────────────────────────
  const tipStyle = {
    position: "fixed",
    zIndex: 10001,
    background: TOKENS.colors.surface,
    borderRadius: TOKENS.borderRadius.card,
    boxShadow: "0 8px 32px rgba(0,0,0,0.2), 0 2px 8px rgba(0,0,0,0.1)",
    padding: vw < 360 ? "16px" : "20px",
    animation: "tourFadeIn 0.3s ease both",
    boxSizing: "border-box",
  };

  if (!tooltipPos || tooltipPos.centered) {
    // Centered fallback
    tipStyle.top = "50%";
    tipStyle.left = "50%";
    tipStyle.transform = "translate(-50%, -50%)";
    tipStyle.width = `${Math.min(300, vw - VIEWPORT_MARGIN * 2)}px`;
  } else {
    tipStyle.width = `${tooltipPos.maxWidth}px`;
    tipStyle.left = `${tooltipPos.left}px`;

    if (tooltipPos.placement === "above") {
      // Position so the tooltip's bottom edge is at tooltipPos.top
      tipStyle.bottom = `${vh - tooltipPos.top}px`;
    } else {
      tipStyle.top = `${tooltipPos.top}px`;
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 10000 }}>
      {/* Keyframes */}
      <style>{`
        @keyframes tourPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(23,89,74,0.35); }
          50% { box-shadow: 0 0 0 14px rgba(23,89,74,0); }
        }
        @keyframes tourFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes tourOverlayIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      {/* Dark overlay with SVG cutout */}
      <svg
        style={{
          position: "absolute", inset: 0,
          width: "100%", height: "100%",
          animation: "tourOverlayIn 0.3s ease both",
        }}
        pointerEvents="none"
      >
        <defs>
          <mask id="tour-mask">
            <rect width="100%" height="100%" fill="white" />
            {spotlight && (
              <circle
                cx={spotlight.centerX}
                cy={spotlight.centerY}
                r={spotlight.radius}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.55)"
          mask="url(#tour-mask)"
        />
      </svg>

      {/* Click blocker */}
      <div
        style={{ position: "absolute", inset: 0 }}
        onClick={(e) => e.stopPropagation()}
      />

      {/* Pulsing spotlight ring */}
      {spotlight && (
        <div
          style={{
            position: "fixed",
            top: spotlight.centerY - spotlight.radius,
            left: spotlight.centerX - spotlight.radius,
            width: spotlight.radius * 2,
            height: spotlight.radius * 2,
            borderRadius: "50%",
            border: `2.5px solid ${TOKENS.colors.green}`,
            animation: "tourPulse 1.8s ease-in-out infinite",
            pointerEvents: "none",
          }}
        />
      )}

      {/* Tooltip card */}
      <div key={animKey} ref={tooltipRef} style={tipStyle}>
        {/* Step indicator + icon */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "10px",
        }}>
          <div style={{
            width: "34px",
            height: "34px",
            borderRadius: "10px",
            background: TOKENS.colors.greenSoft,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}>
            <StepIcon size={17} style={{ color: TOKENS.colors.green }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontFamily: TOKENS.fonts.assistant,
              fontSize: vw < 360 ? "15px" : "17px",
              fontWeight: 500,
              color: TOKENS.colors.ink,
              lineHeight: 1.3,
            }}>
              {current.title}
            </div>
            <div style={{
              fontSize: "11px",
              color: TOKENS.colors.textFaint,
            }}>
              Step {step + 1} of {TOUR_STEPS.length}
            </div>
          </div>
        </div>

        {/* Body */}
        <p style={{
          fontSize: vw < 360 ? "12.5px" : "13.5px",
          color: TOKENS.colors.textMuted,
          lineHeight: 1.55,
          margin: "0 0 16px",
        }}>
          {current.body}
        </p>

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button
            onClick={finish}
            style={{
              background: "none",
              border: "none",
              fontSize: "13px",
              color: TOKENS.colors.textFaint,
              cursor: "pointer",
              padding: "6px 4px",
              fontFamily: TOKENS.fonts.data,
            }}
          >
            Skip tour
          </button>
          <button
            onClick={handleNext}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "10px 18px",
              background: TOKENS.colors.green,
              color: "#fff",
              border: "none",
              borderRadius: TOKENS.borderRadius.pill,
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: TOKENS.fonts.data,
            }}
          >
            {step < TOUR_STEPS.length - 1 ? (
              <>Next <ArrowRight size={14} /></>
            ) : (
              "Got it!"
            )}
          </button>
        </div>

        {/* Progress dots */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          gap: "6px",
          marginTop: "12px",
        }}>
          {TOUR_STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === step ? "16px" : "6px",
                height: "6px",
                borderRadius: "3px",
                background: i === step ? TOKENS.colors.green : TOKENS.colors.border,
                transition: "all 0.3s ease",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default GuidedTour;

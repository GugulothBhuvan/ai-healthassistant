// Design tokens for the Aarogya UI — v3 palette (spec §1)
//
// NOTE: existing keys are load-bearing across every screen — this file only ever
// grows. Never rename or remove a key; add new ones. Legacy aliases remain at the
// bottom of each section for backward compat with onboarding/profile/flags.

export const TOKENS = {
  /* ── v3 spec palette (binding) ─────────────────────────────── */
  v3: {
    paper:     "#FBFAF7",
    card:      "#FFFFFF",
    ink:       "#1A2126",
    muted:     "#6E7780",
    faint:     "#A6ADB3",
    line:      "#EAE7E0",
    green:     "#17594A",
    greenDeep: "#0E3D33",
    greenSoft: "#E3EFE9",
    amber:     "#BB8425",
    amberSoft: "#F7EDD8",
    red:       "#B2544B",   // lab values ONLY
    redSoft:   "#F6E3E1",
  },

  colors: {
    // ── v3 semantic aliases ──
    bg:          "#FBFAF7",        // paper
    surface:     "#FFFFFF",        // card
    surfaceAlt:  "#F3F1EC",        // recessed
    border:      "#EAE7E0",        // line
    ink:         "#1A2126",

    // Brand greens
    primary:      "#17594A",       // green (v3)
    primaryLight: "#E3EFE9",       // greenSoft
    primaryDeep:  "#0E3D33",       // greenDeep

    // Text hierarchy
    textDark:        "#1A2126",    // ink
    textMuted:       "#6E7780",    // muted
    textFaint:       "#A6ADB3",    // faint
    textInverse:     "#F4F6F2",
    textInverseMuted:"#B9C6BC",

    // Accent / amber
    amber:      "#BB8425",
    amberSoft:  "#F7EDD8",

    // Red (lab values ONLY — never for user behavior)
    red:        "#B2544B",
    redSoft:    "#F6E3E1",

    // Green shortcuts
    green:      "#17594A",
    greenDeep:  "#0E3D33",
    greenSoft:  "#E3EFE9",

    // Legacy accent (charts — kept for TrendChart compat)
    accent:     "#E7E29C",
    accentInk:  "#4A4A1F",

    // Clinical Verdict Classes (PRD F2 — unchanged)
    foodFixable:      "#D97736",
    doctorsTerritory: "#BD4A4A",
    both:             "#945BB5",

    // Trackers
    water:  "#4E8CB5",
    weight: "#78877E",

    // Range Bar colors (alias to primary / foodFixable)
    rangeGood:    "#17594A",
    rangeWarning: "#D97736",
    rangeTrackBg: "#EAE7E0",

    // Chart (legacy)
    chartLine:       "#7FA88A",
    chartFillTop:    "rgba(231, 226, 156, 0.28)",
    chartFillBottom: "rgba(231, 226, 156, 0.02)"
  },

  gradients: {
    // Hero card (v3 spec)
    heroCard: "linear-gradient(135deg, #FFFFFF 52%, #EAF4EE 100%)",
    // FAB gradient
    fab: "linear-gradient(150deg, #17594A 0%, #0E3D33 100%)",
    // Legacy hero (dark forest — kept for backward compat)
    hero: "linear-gradient(150deg, #17594A 0%, #0E3D33 55%, #0A2E25 100%)",
    accent:     "linear-gradient(135deg, #EFEAAE 0%, #E1DB8C 100%)",
    invitation: "linear-gradient(150deg, #E3EFE9 0%, #D6E8DD 100%)"
  },

  fonts: {
    // Serif for assistant voice strings (§1: Fraunces)
    assistant: "'Fraunces', Georgia, Cambria, 'Times New Roman', serif",
    // Sans-serif for data / UI (§1: Inter)
    data: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  },

  type: {
    display: "34px",
    h1:      "26px",
    h2:      "22px",
    h3:      "16px",
    body:    "14px",
    caption: "12px",
    micro:   "11px"
  },

  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },

  shadows: {
    // v3 spec card shadow
    card:     "0 1px 2px rgba(26,33,38,0.04), 0 6px 20px rgba(26,33,38,0.05)",
    elevated: "0 10px 30px -6px rgba(23,89,74,0.12), 0 4px 10px -4px rgba(0,0,0,0.05)",
    hero:     "0 18px 42px -12px rgba(14,61,51,0.35)",
    float:    "0 8px 24px -6px rgba(23,89,74,0.28)",
    bottomNav:"0 -4px 16px -1px rgba(0,0,0,0.04)"
  },

  borderRadius: {
    sm:    "10px",
    card:  "18px",       // v3: 18px (was 16)
    cardCompact: "16px", // v3: inner / compact
    lg:    "22px",
    badge: "30px",
    pill:  "999px",
    input: "12px"
  },

  // v3 card border
  cardBorder: "rgba(26,33,38,0.06)",
  // v3 hero card border
  heroCardBorder: "rgba(23,89,74,0.14)",

  motion: {
    fast: "0.18s",
    base: "0.28s",
    slow: "0.5s",
    ease: "cubic-bezier(0.16, 1, 0.3, 1)"
  }
};

// Design tokens for the Aarogya UI (calm, non-clinical, range-bar primitive styles)
//
// NOTE: existing keys are load-bearing across every screen — this file only ever
// grows. Never rename or remove a key; add new ones. Identity stays warm-cream +
// forest-green; the richer hero/gradient/motion tokens are additive polish.

export const TOKENS = {
  colors: {
    bg: "#F9F8F6",           // Soft warm bone/cream background
    surface: "#FFFFFF",      // Clean card surface
    surfaceAlt: "#F3F1EC",   // Recessed / secondary surface
    border: "#E8E6E0",       // Soft separator borders

    // Core brand colors
    primary: "#2C5234",      // Calming dark forest green
    primaryLight: "#E8F0EA", // Light mint background accents
    primaryDeep: "#1E3A24",  // Deeper green for hero gradients
    textDark: "#1A251E",     // Charcoal with a green undertone
    textMuted: "#6B756F",    // Soft sage-grey for hints and subtext
    textInverse: "#F4F6F2",  // Text on dark/hero surfaces
    textInverseMuted: "#B9C6BC", // Muted text on hero surfaces

    // Warm accent (chart callouts, highlights) — the cream note, brand-tuned
    accent: "#E7E29C",       // Soft citron/cream
    accentInk: "#4A4A1F",    // Legible ink on the accent fill

    // Clinical Verdict Classes (PRD F2)
    foodFixable: "#D97736",  // Soft Amber (suggests dietary focus)
    doctorsTerritory: "#BD4A4A", // Soft Crimson (suggests consult required)
    both: "#945BB5",         // Muted Violet (suggests both options)

    // Trackers
    water: "#4E8CB5",        // Soft water blue
    weight: "#78877E",       // Soft slate green

    // Range Bar colors
    rangeGood: "#2C5234",
    rangeWarning: "#D97736",
    rangeTrackBg: "#E8E6E0",

    // Chart
    chartLine: "#7FA88A",        // Line stroke on hero (light on dark)
    chartFillTop: "rgba(231, 226, 156, 0.28)", // Area gradient top
    chartFillBottom: "rgba(231, 226, 156, 0.02)" // Area gradient bottom
  },

  gradients: {
    // Deep forest hero — same "premium hero" energy as the reference, brand-tuned
    hero: "linear-gradient(150deg, #2C5234 0%, #24462B 55%, #1B3520 100%)",
    accent: "linear-gradient(135deg, #EFEAAE 0%, #E1DB8C 100%)",
    invitation: "linear-gradient(150deg, #EDF3EE 0%, #E3EEE6 100%)"
  },

  fonts: {
    // Serif for assistant messages (PRD F7)
    assistant: "'Playfair Display', Georgia, Cambria, 'Times New Roman', serif",
    // Sans-serif for clinical data and metric readouts
    data: "'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  },

  // Type scale (px) — gives the hierarchy contrast the flat wireframe lacked
  type: {
    display: "34px",
    h1: "26px",
    h2: "20px",
    h3: "16px",
    body: "14px",
    caption: "12px",
    micro: "11px"
  },

  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },

  shadows: {
    card: "0 4px 20px -2px rgba(44, 82, 52, 0.04), 0 2px 6px -1px rgba(0, 0, 0, 0.02)",
    elevated: "0 10px 30px -6px rgba(44, 82, 52, 0.12), 0 4px 10px -4px rgba(0, 0, 0, 0.05)",
    hero: "0 18px 42px -12px rgba(27, 53, 32, 0.45)",
    float: "0 8px 24px -6px rgba(44, 82, 52, 0.28)",
    bottomNav: "0 -4px 16px -1px rgba(0, 0, 0, 0.04)"
  },

  borderRadius: {
    sm: "10px",
    card: "16px",
    lg: "22px",
    badge: "30px",
    pill: "999px",
    input: "12px"
  },

  motion: {
    fast: "0.18s",
    base: "0.28s",
    slow: "0.5s",
    ease: "cubic-bezier(0.16, 1, 0.3, 1)"
  }
};

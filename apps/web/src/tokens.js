// Design tokens for the Aarogya UI (calm, non-clinical, range-bar primitive styles)

export const TOKENS = {
  colors: {
    bg: "#F9F8F6",           // Soft warm bone/cream background
    surface: "#FFFFFF",      // Clean card surface
    border: "#E8E6E0",       // Soft separator borders
    
    // Core brand colors
    primary: "#2C5234",      // Calming dark forest green
    primaryLight: "#E8F0EA", // Light mint background accents
    textDark: "#1A251E",     // Charcoal with a green undertone
    textMuted: "#6B756F",    // Soft sage-grey for hints and subtext
    
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
    rangeTrackBg: "#E8E6E0"
  },
  
  fonts: {
    // Serif for assistant messages (PRD F7)
    assistant: "'Playfair Display', Georgia, Cambria, 'Times New Roman', serif",
    // Sans-serif for clinical data and metric readouts
    data: "'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  },
  
  shadows: {
    card: "0 4px 20px -2px rgba(44, 82, 52, 0.04), 0 2px 6px -1px rgba(0, 0, 0, 0.02)",
    bottomNav: "0 -4px 16px -1px rgba(0, 0, 0, 0.04)"
  },
  
  borderRadius: {
    card: "16px",
    badge: "30px",
    input: "12px"
  }
};

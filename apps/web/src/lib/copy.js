// Reviewed copywriting dictionary (F7 rules: observation first, <=10 words, no exclamation marks)
// v3 additions: §8 verbatim strings marked with ✎ for Fraunces (serif) rendering

export const COPY_STRINGS = {
  // Toasts
  "toast.plainConfirm": "Logged successfully.",
  "toast.markerLink": "{food} moved your {marker} progress.",
  "toast.waterLogged": "Logged {count} glasses of water.",
  "toast.weightLogged": "Logged weight of {weight} kg.",
  "toast.noted": "Noted.",
  "toast.addedMedicine": "Added. I'll keep track with you.",
  "toast.summaryReady": "Summary ready to download.",
  "toast.oneGlass": "One glass down.",

  // Assistant states
  "assistant.decline": "I only log things — food, water, weight.",
  "assistant.unknownDish": "Unrecognized dish: {dish}. Tap to correct.",
  "assistant.parseError": "Parsing failed. Try speaking or typing again.",
  "assistant.medicineSaw": "Saw: {name}. Add to your medicines?",
  "assistant.medicineDecline": "That's a your-doctor question. If they prescribe something, snap it and I'll track it with you.",

  // Home Dashboard
  "home.invitationState": "Add a health report and this screen learns your body.",
  "home.honestyCap": "Only your next blood test knows for sure.",
  "home.trendTitle": "This week's energy",
  "home.tapForFoods": "Tap for food guidance",
  "home.markersTitle": "From your report",
  "home.intakeTitle": "Today's progress",
  "home.getStarted": "Start here",
  "home.entryLogTitle": "Log a meal",
  "home.entryLogBody": "Speak or type what you ate.",
  "home.entryReportTitle": "Add a report",
  "home.entryReportBody": "Personalise this from your bloodwork.",
  // v3 additions
  "home.dailyLine": "Good walk this morning. Protein's the gap now — dal would do it.",
  "home.behindForDay": "behind for the day",
  "home.fromReport": "from your Jun 28 report",
  "home.fromPrescription": "from your snapped prescription",
  "home.youAddedThis": "you added this",

  // Diet-aware food guidance (suggestions only — never outcome claims)
  "guidance.iron.veg": "Palak, dal, chana, and jaggery carry iron.",
  "guidance.iron.nonveg": "Chicken liver, mutton, palak, and dal carry iron.",
  "guidance.vitamin_d.default": "Egg yolk, mushrooms, fortified milk, morning sun.",
  "guidance.hba1c.default": "More fibre, whole dals, fewer refined carbs.",
  "guidance.generic": "Balanced dals, greens, and whole grains help.",

  // Onboarding report moment
  "onboarding.reportValueTitle": "Turn your bloodwork into daily food guidance.",
  "onboarding.reportValueBody": "One upload. Every meal starts closing your gaps.",
  "onboarding.reportPreviewCaption": "This is what a linked report unlocks.",
  "onboarding.reportSkip": "Not now — I'll add it later.",

  // Reports & Flags
  "flags.headerProportion": "Two flags need attention. Neither is urgent.",
  "flags.lowConfidenceTray": "Uncertain marker extractions. Excluded from flags.",

  // Nudges & Comeback
  "nudge.observation": "Your iron's been quiet. Palak tonight?",
  "comeback.noGapReference": "Welcome back. We start from today.",

  // ── v3 Trends (§4) ──
  "trends.subtitle": "Quietly closing the gap.",
  "trends.markerInsight": "More dal and palak did this.",
  "trends.honestyCap": "Only your next test knows for sure.",
  "trends.noticedWeek": "Protein dips on office days — Tuesdays and Thursdays average 31g.",
  "trends.logCaption": "A record, not a scoreboard.",

  // ── v3 Health (§5) ──
  "health.subtitle": "Everything true about your body, with receipts.",
  "health.medicineDisclaimer": "We track what your doctor decided. We never suggest what to take.",
  "health.footerPrivacy": "Your report stays yours. We read it, we don't keep score on you.",
};

/**
 * Utility to retrieve and format a copy string by key with custom slot replacements.
 * @param {string} key
 * @param {Record<string, string>} slots
 */
export function t(key, slots = {}) {
  let string = COPY_STRINGS[key] || key;

  Object.entries(slots).forEach(([slotName, value]) => {
    string = string.replace(new RegExp(`{${slotName}}`, "g"), value);
  });

  return string;
}

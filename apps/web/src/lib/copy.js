// Reviewed copywriting dictionary (F7 rules: observation first, <=10 words, no exclamation marks)

export const COPY_STRINGS = {
  // Toasts
  "toast.plainConfirm": "Logged successfully.",
  "toast.markerLink": "{food} moved your {marker} progress.",
  "toast.waterLogged": "Logged {count} glasses of water.",
  "toast.weightLogged": "Logged weight of {weight} kg.",
  
  // Assistant states
  "assistant.decline": "I only log things — food, water, weight.",
  "assistant.unknownDish": "Unrecognized dish: {dish}. Tap to correct.",
  "assistant.parseError": "Parsing failed. Try speaking or typing again.",
  
  // Home Dashboard
  "home.invitationState": "Add a health report and this screen learns your body.",
  "home.honestyCap": "Only your next blood test knows for sure.",
  "home.trendTitle": "This week's energy",
  "home.tapForFoods": "Tap for food guidance",
  "home.markersTitle": "From your report",
  "home.intakeTitle": "Today's progress",

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
  "comeback.noGapReference": "Welcome back. We start from today."
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

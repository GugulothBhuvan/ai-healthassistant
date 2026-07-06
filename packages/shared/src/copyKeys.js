// Keys referenced by both the API (which selects a key + slot values) and the
// web app (which owns the actual string in apps/web/src/lib/copy.js).
// Adding a new server-emitted string requires adding a key here first.
export const CopyKey = {
  TOAST_PLAIN_CONFIRM: "toast.plainConfirm",
  TOAST_MARKER_LINK: "toast.markerLink",
  TOAST_WATER_LOGGED: "toast.waterLogged",
  TOAST_WEIGHT_LOGGED: "toast.weightLogged",
  ASSISTANT_DECLINE: "assistant.decline",
  ASSISTANT_UNKNOWN_DISH: "assistant.unknownDish",
  ASSISTANT_PARSE_ERROR: "assistant.parseError",
  HOME_INVITATION_STATE: "home.invitationState",
  HOME_HONESTY_CAP: "home.honestyCap",
  FLAGS_HEADER_PROPORTION: "flags.headerProportion",
  FLAGS_LOW_CONFIDENCE_TRAY: "flags.lowConfidenceTray",
  NUDGE_OBSERVATION: "nudge.observation",
  COMEBACK_NO_GAP: "comeback.noGapReference",
};

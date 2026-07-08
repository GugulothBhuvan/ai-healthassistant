# Aarogya — Change List for Antigravity

**Source:** UI/UX audit (17 screens) + hiring manager video review (Superkana take-home)
**Purpose:** Actionable engineering tickets, prioritized by severity, for an AI coding agent to implement directly against the codebase.

Each ticket has: **Problem → Where → Why it matters → Fix → Acceptance criteria**, so Antigravity can implement and self-verify without needing back-and-forth.

---

## P0 — Trust-breaking bugs (fix first, these make the demo look broken/dishonest)

### P0-1: Fabricated data renders before real input exists
**Where:** Onboarding → Daily Targets screen; Health tab (Iron card); About You (name/profile)
**Why it matters:** User enters fresh data (age 27, height 186, weight 68) and is immediately shown someone else's name ("Priya"), a pre-filled profile, and a specific iron deficiency number (45 µg/dL) with zero blood data uploaded. This breaks trust in every other number in the app — reviewer explicitly called this out as the root confusion.
**Fix:**
- Remove all hardcoded/sample data from live app state. If sample data is needed for a screen mockup, it must be visually distinct (e.g., labeled "Example" with a muted/dashed treatment) and never appear in the actual user session.
- The Iron card / any blood-marker output must only render after a report is actually uploaded and parsed. Before that, show a placeholder state: "Upload a report to see your first marker" — no numbers, no ranges.
- `name` field must default to empty/placeholder ("there" / generic icon) until the user actually enters a name in onboarding — verify this isn't silently seeded from a fixture or previous test session.
- Reset Profile & Settings must fully clear all app state (local storage / mock DB / session), including anything currently hardcoded, so a fresh reset genuinely starts from zero.
**Acceptance criteria:** A brand-new session, before any onboarding input, shows zero personalized numbers anywhere in the app. After onboarding with real inputs, every downstream number (targets, name, greeting) traces to what the user actually entered.

### P0-2: Logging a meal has no visible effect
**Where:** Home screen → Log Assistant sheet → "Logged Today" section
**Why it matters:** Voice/text logging is the core loop of the entire product. Reviewer logged "2 roti aur paneer ki sabji" and the Home screen still showed "Nothing logged yet." If the single most important interaction produces no visible feedback, the product fails its own demo.
**Fix:**
- After any successful log (voice, text, or photo), immediately update: (a) the "Logged Today" list with the parsed item(s), (b) the macro progress bars (Protein/Carb/Fat/Fibre %), (c) the "0 in" calorie counter.
- This must work even on a frontend-only/mocked backend — update local/mock state synchronously on log submission. It's fine if it resets on refresh, but it must persist for the duration of the session.
- Add a lightweight confirmation toast/inline state ("Logged: 2 roti, 1 paneer sabji") immediately after submission so the user gets feedback even before scrolling to see the updated list.
**Acceptance criteria:** Logging any item via any input method updates the Home screen state in the same session without requiring a refresh.

---

## P1 — Broken mental models (comprehension bugs, not just copy)

### P1-1: Onboarding CTA language implies pre-existing state
**Where:** "Diet & Habits" screen → "Calculate Targets" button; "Set Daily Targets" screen intro copy
**Why it matters:** Reviewer read "Calculate Targets" / the subsequent target screen as if targets already existed and he was being sent to "see" them, rather than understanding the app was about to generate something new for him.
**Fix:** Keep onboarding CTA copy sequential and neutral until targets are actually generated: use "Next" / "Continue" through the flow, and only switch to result-oriented language ("Here are your targets") on the screen where targets are actually first presented.
**Acceptance criteria:** No onboarding CTA before the targets-generation step implies that targets/results already exist.

### P1-2: "Derived from your metrics" has no visible derivation
**Where:** "Set Daily Targets" screen ("These are calculated based on your Mifflin-St Jeor details...")
**Why it matters:** The formula name is shown but the actual inputs feeding it aren't visibly connected — user can't trace calorie/protein/fibre numbers back to what he entered.
**Fix:** Add a collapsible/expandable line under the targets: "Based on your age (27), height (186cm), weight (68kg), and activity level (Mostly sitting) — Mifflin-St Jeor formula." Pull these values directly from the onboarding state so they're guaranteed to match.
**Acceptance criteria:** Tapping/expanding the targets explanation shows the exact input values the user entered in prior onboarding screens.

### P1-3: Blood report upsell lacks "why now" context
**Where:** Pre-onboarding "Turn your bloodwork into daily food guidance" screen
**Why it matters:** Reviewer didn't understand why the app was asking for a blood report at this specific moment, or what "closing your gaps" means before any data exists. (Compounds directly with P0-1 — the fake iron number made this worse.)
**Fix:** Once P0-1 is fixed (no fake number shown), rewrite this screen to explain the mechanism generically instead of showing a specific fabricated result: "Upload a blood report and we'll flag anything outside the healthy range — like iron or Vitamin D — and suggest foods that help." Keep the "Not now" skip prominent.
**Acceptance criteria:** This screen never displays a specific marker value/number unless the user has actually uploaded a report.

### P1-4: Quantity parsing has no visible confirmation, and is inconsistent
**Where:** Log Assistant sheet, after submitting a multi-item log ("2 roti aur paneer ki sabji")
**Why it matters:** The assistant asked a follow-up only about the sabji quantity, silently assumed "2" for roti, and never showed the user what it understood for either item. Reviewer had no way to verify or correct the parse.
**Fix:**
- After every log submission (not just when the parser is uncertain), show a structured confirmation of what was parsed: itemized list with quantities (e.g., "Roti — 2, Paneer sabji — 1"), with inline edit/tap-to-correct on each line, before final commit.
- Only ask a clarifying follow-up question when quantity truly cannot be inferred (e.g., no number mentioned at all) — but always show the full parsed breakdown regardless, so behavior is consistent whether or not a follow-up is triggered.
**Acceptance criteria:** Every log action — regardless of whether the parser needed clarification — ends with the user seeing an itemized, editable summary before it's added to the log.

---

## P2 — Interaction hierarchy (confirmed independently by two reviewers)

### P2-1: Competing, unlabeled logging entry points on Home
**Where:** Home screen (camera icon, plus icon, mic FAB) — also confirmed broken on mobile
**Why it matters:** Both the UI audit and the hiring manager independently flagged that a first-time user cannot tell which of camera / plus / mic is the "main" way to log, or how the icons differ from the Log Assistant sheet the FAB opens.
**Fix:**
- Designate the mic FAB → Log Assistant sheet as the single primary entry point (it already unifies voice, text, and camera in one place — see P2-2 below).
- On the Home "Today" card, remove or visually demote the standalone camera/plus icons to avoid duplicating what the sheet already does. If they must stay for quick-add convenience, restyle them as clearly secondary (smaller, outlined, grouped under a "Quick add" label) rather than equal-weight to the FAB.
**Acceptance criteria:** A first-time user, shown only the Home screen, can identify a single obvious primary action for logging without needing the guided tour to explain it.

### P2-2: Inconsistent visual identity for voice/camera across screens
**Where:** Home FAB (large circular green mic) vs. Log Assistant sheet (small icon mic inside input field) vs. camera icon styling on Home vs. inside the sheet
**Why it matters:** Same actions (voice input, photo input) look like different features depending on which screen the user is on.
**Fix:** Standardize icon size, shape, and color treatment for mic and camera actions across Home and the Log Assistant sheet — the sheet's icons should visually read as "this is what that FAB opened," not a separate component.
**Acceptance criteria:** Mic and camera icons use the same visual token (size/color/shape) in both locations.

### P2-3: Feature naming inconsistency
**Where:** Modal title "Log Assistant" vs. guided tour "Talk to Aarogya" vs. Home helper text "Type or talk to record..."
**Why it matters:** Three different names for one feature dilutes the "Aarogya" assistant persona at the exact moments it should be reinforced.
**Fix:** Standardize on the assistant's name ("Aarogya") in the sheet title and tour copy; keep Home helper text as a functional description, not a competing label.
**Acceptance criteria:** Every surface that opens or references the logging assistant uses consistent naming.

---

## P3 — Visual polish (from the earlier screen-by-screen audit; lower priority than the above)

| # | Issue | Where | Fix |
|---|---|---|---|
| P3-1 | "Upload Report" CTA is gold on the pre-onboarding upsell but dark green everywhere else | Pre-onboarding screen vs. Home/Health tab | Standardize to one color for this CTA across the app |
| P3-2 | Week/Month toggle uses black for selected state; every other selector in the app uses brand green | Trends tab | Change toggle selected-state to brand green |
| P3-3 | Avatar shows lowercase "t" (likely pulling first letter of fallback greeting "there") when no name is set | Home top-right avatar | Default to a placeholder person icon until a real name exists |
| P3-4 | Blood report ask repeated in 4 places in first session (pre-onboarding, Home priorities, Health tab, Trends) despite user already skipping once | Home, Health, Trends | Suppress the Home "priorities" card version after first dismissal; keep it contextually in Health/Trends only |
| P3-5 | Energy "in vs burned" chart renders as bare axis labels with no data, no ghost state, no message | Trends tab | Add an empty-state treatment (icon + line) consistent with other empty states in the app |
| P3-6 | Health tab and About You screens end in large unexplained blank space | Health, About You | Tighten layout or add a lightweight closing element |
| P3-7 | No progress indicator across the 6-screen onboarding flow (tour has "Step X of 5" but onboarding doesn't) | Onboarding | Add a step indicator (dots or "Step X of 6") to onboarding |
| P3-8 | "0 in" calorie label is ambiguous | Home Today card | Change to "0 kcal" or add explicit "in" subtext/label |
| P3-9 | Documents card vs. Body card on Health tab have mismatched content density, creating lopsided layout | Health tab | Balance card heights/content or restructure to single column |
| P3-10 | Muted caption text (tan labels in About You, light grey subtitles) may fail WCAG AA contrast on cream background | About You, various | Run contrast check; darken if below 4.5:1 for body text |
| P3-11 | "Doctor summary" chip lacks visual affordance signaling button/status/nav | Health tab header | Style clearly as a tappable action if it leads somewhere |
| P3-12 | Example chips in Log Assistant sheet aren't labeled as examples and may not be tappable-to-autofill | Log Assistant sheet | Add a small "Try saying" label above chips; make them tap-to-fill the input if not already |

---

## Suggested order of execution for Antigravity

1. **P0-1, P0-2** — these are the ones that make the app look non-functional or dishonest in a demo. Fix before anything else.
2. **P1-1 through P1-4** — comprehension fixes, directly quoted from reviewer confusion, moderate effort.
3. **P2-1 through P2-3** — consolidate logging entry points and naming; do this after P0/P1 since the Log Assistant sheet's behavior needs to be correct first.
4. **P3 list** — polish pass, can be batched together at the end.

---

*Compiled from: 17-screen UI/UX walkthrough audit + hiring manager video review transcript (Superkana take-home evaluation).*

# PRD — Aarogya · The AI Health Assistant
## Detailed Product Requirements · v2.1 (refined)

**Owner:** Bhuvan Raj · **Status:** Final for submission · **Companions:** TRD v1.0 · working prototype (mobile + web)

---

## 1. Overview

**One line:** The layer between your lab report and your plate — an AI assistant that reads your bloodwork in plain language and tells you daily whether your everyday food is closing your body's gaps.

**Positioning:** For urban Indians whose health reports flag problems food can fix, Aarogya is the only assistant that connects what's on your thali to what's in your bloodwork — unlike calorie trackers that count intake and charge for meaning.

**Problem (validated via firsthand competitive audit):**
1. Food logging dies of friction — incumbents demand 15–20 micro-decisions per Indian meal against Western-biased databases; logging churn is the category's defining failure.
2. Lab reports die in drawers — millions delivered yearly as WhatsApp PDFs and printouts; standard outcome is a 4-minute consult and no behavior change.
3. No product connects the two. The market leader paywalls macro meaning (documented: free tier shows Protein/Carb/Fat/Fibre locked behind Premium) and monetizes urgency (countdown timers, deal takeovers). The global default serves display ads inside the food diary. Both are structurally barred from giving meaning away.

**Bet:** personalization from bloodwork, input as natural language, meaning free by default. Incumbents cannot copy point three without breaking their P&L.

## 2. Goals & non-goals

**Goals (Phase 1):**
- G1: A report-holder reaches their first plain-language insight within 90 seconds of first open.
- G2: A user logs a full Indian meal in one spoken/typed sentence with ≤1 optional correction.
- G3: Every food log is scored against the user's flagged markers and the connection is surfaced immediately.
- G4: Week-3 logging retention among report-linked users ≥ 40% at ≥4 days/week (H1).

**Non-goals (Phase 1):** workout tracking, photo logging, chatbot/companion surface, streaks/badges, wearable sync, community, coach marketplace, supplement/dosage recommendations, any diagnostic claim.

## 3. Personas

**P1 · Priya, 32 — the wedge.** Product designer, Bangalore. Annual corporate checkup: Iron 45 µg/dL, Vit D 16 ng/mL. Vegetarian; cooks dinner, orders lunch 3×/week. Churned HealthifyMe twice. JTBD: *"When my health report flags something, help me know whether my normal food is fixing it — without making tracking my second job."* Forgives ±30% estimate error; won't forgive gram-precision demands, mid-task upsells, judgment tone.

**P2 · Rajesh, 47 — fast-follow & stress test.** Bank manager, Pune; diabetic 6 years; quarterly HbA1c. Wife cooks; he knows dishes, never ingredients. Reports arrive as photographed printouts. Drives: Hinglish parsing, photo-ingest tolerance, zero-correction-safe defaults, never-guilt tone.

**Anti-persona · Arjun, 26.** Precision gym tracker. His success metric (gram accuracy) is our anti-metric. Feature test on every proposal: "does this serve Arjun more than Priya?" → reject.

## 4. Feature specifications (Phase 1)

### F1 · Onboarding (3 screens, no login, ~60s)

**User story:** As a new user, I answer only questions the product spends immediately, so the first minute feels like receiving value, not giving data.

Screens: (S1) height/weight/age/sex with rationale copy; (S2) diet [vegetarian / eggs ok / non-veg] + activity [mostly sitting / somewhere between / on my feet a lot]; (S3) computed targets strip (Mifflin-St Jeor × activity factor; protein 0.9 g/kg; fibre 30 g) + report prompt with two upload paths + one-tap skip.

**Acceptance criteria:**
- AC1: No authentication, goal-picker, or fitness questions anywhere in flow.
- AC2: Targets visibly derived from inputs and displayed before home.
- AC3: Diet answer changes food suggestion content everywhere (verified: iron guidance differs veg vs. non-veg).
- AC4: Skip requires exactly one tap and produces no guilt copy.
- AC5: Median completion < 75 s (usability-tested).
- AC6: No question is asked whose answer the product cannot spend on day one; later needs use just-in-time prompts (progressive profiling), never onboarding.

### F2 · Report ingestion & flags

**User story:** As a report-holder, I upload the file in whatever form it exists and get told, in plain words, what matters, what food can fix, and what belongs to my doctor.

Inputs: PDF (incl. WhatsApp-forwarded) and photo of printout (skew/stain tolerant). Parse state shows progress ("Reading your panel… found 24 markers"). Results screen: proportion-first header ("Two things worth your attention. Neither is urgent."), flag cards in range-bar grammar (value marker on reference band, large numeral + unit, range caption), verdict line sorting *food-fixable* vs. *doctor's territory*, tap-to-expand diet-aware food guidance, in-range summary row.

**Acceptance criteria:**
- AC1: Supported inputs parse ≥90% of top-10 Indian lab formats (Phase-1 gate: ≥1 format live end-to-end, others stubbed with roadmap note).
- AC2: Every flag carries exactly one verdict class: food-fixable | doctor's territory | both.
- AC3: No diagnostic language anywhere; string-level lint enforces banned terms (diagnose, disease names as verdicts, "you have").
- AC4: Time from upload to rendered flags ≤ 15 s P75.
- AC5: Markers extracted below confidence threshold appear in a "couldn't read confidently" tray — excluded from flags, never guessed.
- AC6: Purpose-scoped consent is captured at upload (DPDP); report data serves only the user's own insights; delete-on-demand honored.
- AC7: A second report upload (any time, via assistant) diffs against prior values ("45 → 62") — Phase 1: designed state; Phase 2: live.

### F3 · The Assistant (logging core)

**User story:** As a user, I tell the assistant what I ate the way I'd tell a friend — by voice or by typing — and it commits a sensible log I can optionally correct.

Entry: center FAB (mobile) opens the composer — text field and mic as equal peers, plus example chips; persistent bottom command bar (web). Pipeline: speech→text (Hinglish) → intent classification (food / water / weight / report / other) → dish-level parse with portion defaults (small/medium/large katori model) → multi-intent splitting → visible "thinking" state during parse → interpretation echo ("Heard: …") rendered as a conversational exchange (user bubble + assistant card) with S/M/L chips → single confirm. The exchange is ephemeral — it closes when the log lands.

**Acceptance criteria:**
- AC1: Voice and typed input route through identical intent + parse logic (one brain, two mouths).
- AC2: Multi-intent utterance ("do roti dal, aur ek glass paani") produces both logs on one confirm.
- AC3: Unknown dish yields nearest-match proposal + manual fix path; never a dead end, never a form.
- AC4: No clarifying question is ever required to commit a log (defaults always sufficient).
- AC5: No chat history surface exists; out-of-scope input receives an in-character decline ("I only log things — food, water, weight") — the assistant is a verb, not a companion.
- AC6: Accepted-without-correction rate ≥70% (correction telemetry wired from day one as the trust guardrail).
- AC7: Text fallback reachable in ≤1 tap from any assistant state; parse failure surfaces an honest error state with retry, never a silent guess.

### F4 · Marker-linkage engine

**User story:** As a user with flagged markers, every food I log tells me whether it moved my gap — so food acquires a reason.

Mapping: flagged marker → nutrient(s) → per-dish contribution. Production ground truth: ICMR/NIN Indian Food Composition Tables (IFCT); the LLM resolves dish names to IFCT entries but never generates nutrient values. Payoff surfaced in the confirm toast ("Logged. That dal moved your iron bar.") and the home marker card (weekly intake-vs-need progress).

**Acceptance criteria:**
- AC1: Toast references the user's specific flagged marker only when the logged dish genuinely contributes to it.
- AC2: Without a report, all marker language is absent (no fake personalization); toast degrades to plain confirmation.
- AC3: Marker-progress claims are intake-side only; outcome claims are banned strings ("your ferritin is improving" → lint failure). The honesty cap ("Only your next test knows for sure") ships as the standard weekly string.

### F5 · Home

Hierarchy (top→bottom): date/greeting · assistant's daily line (one proactive serif sentence) · From-your-report marker cards (or invitation state: "Add a health report and this screen learns your body") · Today's intake (calories + 4 macros vs. computed targets) · tracker row (water tap-to-add, weight, steps placeholder) · logged-today list. Bottom nav: Home · Week · Assistant (center) · Report · You.

**Acceptance criteria:** marker layer always ranked above macros when present; invitation state replaces (never hides) the marker slot; every progress visual uses the range-bar primitive; exactly one proactive assistant line per day.

### F6 · Retention layer

One nudge/day hard cap, marker-anchored, observation-first ("Your iron's been quiet for two days. Palak tonight?"). Comeback state after ≥3-day gap: "Welcome back. We start from today." — no gap reference, no streak mechanics anywhere. Weekly summary: trend in range-bar grammar + behavioral attribution ("More dal and palak this week did this") + honesty cap.

**Acceptance criteria:** nudge scheduler cannot emit >1/day; comeback copy contains no reference to absence duration; zero badge/streak/leaderboard components exist in the codebase.

### F7 · Voice & copy system (binding)

Rules: observation before instruction · agency over verdict · ≤ ~10 words where possible · Hinglish-natural food names · no exclamation marks except genuine wins · no food moralizing · serif = assistant speaking, sans = data. All strings live in a single reviewed copy file; changes require copy-owner sign-off.

## 5. Metrics

**North Star:** weekly active loggers with a linked report.
**Guardrails:** voice-correction rate <30% · nudge opt-out <10% · free-tier task completion (no paywall drift).
**HEART (India-calibrated):**
- Happiness: post-flags micro-survey; Sean Ellis ≥30% at week 3 (behavioral-weighted; politeness bias discounted).
- Engagement: 1–2 logs/active day (Indian 2-meals+chai norm — not Western 4-log expectations).
- Adoption: report→first-log in session one <3 min; messy-input parse success ≥90% is an adoption metric (reports arrive as WhatsApp PDFs and photos).
- Retention: week-3 ≥4 log-days/week among report-linked (H1 — the PMF needle).
- Task success: voice/text log accepted-as-is ≥70%; report parse ≤15 s P75.
**Pre-build validation:** WhatsApp concierge (users voice-note meals, human replies with gap analysis, 1 week, n=10) — the riskiest assumption is behavioral, not technical.

## 6. Rollout

Phase 1a: concierge test → Phase 1b: closed beta, one wedge city, one lab format live → Phase 1c: open beta with generalized parsing → Phase 2 gates: chronic-persona features unlock only after H1 holds.

## 7. Risks

| Risk | Mitigation | Owner |
|---|---|---|
| Logging habit doesn't sustain | Concierge validation precedes build-out; report anchoring; nudge restraint | PM |
| Clinical overclaim | Banned-string lint; verdict-class taxonomy; medical review of copy file | PM + advisor |
| DPDP non-compliance | Consent at upload (F2·AC6); purpose limitation; delete-on-demand | Eng + Legal |
| Parse trust erosion | Visible interpretation; correction telemetry as guardrail (F3·AC6) | Eng |
| Incumbent copies report ingest | They must paywall it; our free-meaning position is standing defense | PM |
| Scope creep | Non-goals list; the Arjun test | PM |

## 8. Prototype appendix — what the accompanying demo actually runs

The submitted prototype implements F1–F6 as an interactive flow (mobile + web, shared design system). Status per layer, stated plainly:

| Layer | Status in prototype |
|---|---|
| Assistant parsing (typed + voice) | **Live** — real LLM call with constrained-JSON prompt; parses arbitrary Hinglish input, splits multi-intent, flags unknown dishes with closest match, declines out-of-scope in character |
| Voice capture | **Live** — browser speech recognition (en-IN), streaming transcript; graceful typed fallback where unsupported |
| Nutrition estimates | Live LLM estimation at standard Indian portions — the deliberate prototype shortcut; production replaces with IFCT table lookup per F4 (LLM interprets, tables provide numbers) |
| Targets, S/M/L multipliers, diet branching, log math | **Live** — computed, not scripted |
| Report parse | Fixture (Priya's values pre-loaded); production pipeline specified in TRD §3.5 |
| Nudges / comeback / weekly states | Designed states, reachable in-app |

Rule held throughout: the prototype never presents a fixture as live; every seam is named here.

## 9. Open questions

Marker→nutrient mapping depth v1 (rule tables vs. LLM-mediated edge coverage) · generalized report-parsing timeline · regional language sequencing post-Hinglish · voice grammar disambiguation ("58 glasses" vs. "weight 58").

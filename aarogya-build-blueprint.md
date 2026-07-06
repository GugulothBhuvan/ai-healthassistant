# Aarogya — Web App Build Blueprint
## Stack: React (Vercel) · Node/Express API (Render) · Supabase (auth + Postgres) · Krutrim (LLM) · Sarvam (STT/TTS)
### v1.0 · companion to PRD v2.1 / TRD v1.1

---

## 1. Architecture

```
[Browser — React SPA on Vercel]
   │ supabase-js (anonymous session → JWT)
   │ fetch → API (JWT in Authorization header)
   ▼
[Render — Node/Express API]                    [Supabase]
   ├─ verifies Supabase JWT                     ├─ Auth (anonymous sign-in; email/OTP upgrade later)
   ├─ /assistant/exchange → Krutrim (intent+parse)   ├─ Postgres (users, logs, reports, markers) + RLS
   ├─ /stt → Sarvam Saaras (audio → text)      └─ Storage (report PDFs/photos)
   ├─ /tts → Sarvam Bulbul (text → audio, optional toggle)
   ├─ /reports → Krutrim vision (extract) → normalizer → flags
   └─ deterministic layer: portion math, marker linkage, copy keys
```

Rules:
- **No AI vendor key in the browser.** All Krutrim/Sarvam calls proxy through Render.
- **Server returns copy keys + slot values**; the React app renders strings from the shared copy file.
- **Anonymous-first auth**: `supabase.auth.signInAnonymously()` on first open → session + RLS work with zero login UI. PRD F1·AC1 holds. Email link attach offered later (progressive profiling applies to identity too).

## 2. Repo structure (monorepo)

```
aarogya/
├── apps/
│   ├── web/                      # Vercel
│   │   ├── src/
│   │   │   ├── App.jsx           # breakpoint shell: <640px bottom-nav+FAB, wider sidebar+composer
│   │   │   ├── screens/          # Onboarding, Flags, Home, Week, Profile, ReportPage
│   │   │   ├── assistant/        # ComposerSheet, useAssistant() hook, mic capture
│   │   │   ├── components/       # RangeBar, Voice, Label, cards (from prototype v6)
│   │   │   ├── lib/
│   │   │   │   ├── supabase.js   # client, anonymous session bootstrap
│   │   │   │   ├── api.js        # fetch wrapper (JWT header, error states)
│   │   │   │   └── copy.js       # the copy file — single source of every string
│   │   │   └── tokens.js         # T palette, serif/sans, cardS (from v5/v6)
│   │   └── vercel.json
│   └── api/                      # Render
│       ├── src/
│       │   ├── index.js          # Express bootstrap, JWT middleware
│       │   ├── routes/
│       │   │   ├── assistant.js  # /exchange, /confirm
│       │   │   ├── speech.js     # /stt (multipart audio), /tts
│       │   │   ├── reports.js    # upload → extract → normalize → flags
│       │   │   └── home.js       # /home, /week, /onboarding
│       │   ├── ai/
│       │   │   ├── krutrim.js    # OpenAI-compatible client, model registry
│       │   │   ├── prompts/      # intent.js, foodParse.js, reportExtract.js (constrained JSON)
│       │   │   └── sarvam.js     # STT/TTS wrappers
│       │   ├── engine/
│       │   │   ├── portions.js   # S/M/L multipliers, defaults
│       │   │   ├── markers.js    # marker→nutrient map, verdict rules (versioned JSON)
│       │   │   └── targets.js    # Mifflin-St Jeor
│       │   └── db.js             # Supabase service-role client (server-side only)
│       └── render.yaml
└── packages/shared/              # copy keys enum, zod schemas for parse JSON (shared FE/BE)
```

## 3. Endpoint contracts

```
POST /assistant/exchange
  in:  { text?: string, audio?: base64 }         # audio → /stt internally first
  out: { transcript, parsed: {heard, food[], water_glasses, weight_kg, unknown[], iron_relevant, decline?},
         confirm_token }

POST /assistant/confirm
  in:  { confirm_token, size: "small"|"medium"|"large" }
  out: { logs_created[], intake_delta, marker_deltas[], toast_key, toast_slots }

POST /reports            multipart (file) + consent_scope
  out: { report_id }     # then GET /reports/:id/flags polls → {flags[], low_confidence_tray[], in_range_count}

GET  /home  · GET /week  · POST /onboarding {profile} → {targets}
```

## 4. Krutrim integration (model registry)

Krutrim exposes an OpenAI-compatible endpoint; one client, roles pinned:

```js
// ai/krutrim.js
const ROLES = {
  intent:  "gemma-4-E4B-it",        // every exchange — cheapest (₹3/₹8 per 1M)
  parse:   "gemma-4-26B-A4B-it",    // food parsing (₹7/₹28)
  vision:  "gemma-4-31b-it",        // report extraction (₹9/₹33)
  escalate:"gpt-oss-120b",          // low-confidence retry only
};
export async function llm(role, messages, schema) {
  const r = await fetch(`${process.env.KRUTRIM_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.KRUTRIM_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: ROLES[role], messages, temperature: 0, response_format: { type: "json_object" } }),
  });
  const data = await r.json();
  return schema.parse(JSON.parse(data.choices[0].message.content)); // zod-validated; throw → retry once → escalate
}
```

Prompts: port the prototype's system prompt, split in two — intent (labels + spans) and foodParse (dishes/portions/unknowns). Nutrition estimation stays LLM-side at launch (prototype parity), with `engine/` structured so IFCT lookup replaces it without touching routes — the TRD's "tables provide numbers" migration is a drop-in.

## 5. Sarvam integration

```js
// STT: POST audio (webm/opus from MediaRecorder) → Sarvam Saaras
//   language: unspecified/auto for code-mixed; attach dish-lexicon bias terms if supported
// TTS: Sarvam Bulbul, Hinglish-capable; ONLY behind a user toggle — default is silent
```
Frontend mic: `MediaRecorder` → blob → `/assistant/exchange` with audio. (This replaces the prototype's browser SpeechRecognition — server STT is consistent across browsers, including iOS Safari where Web Speech is unreliable.)

## 6. Supabase schema (RLS on everything)

```sql
create table profiles (id uuid primary key references auth.users, height_cm int, weight_kg int,
  age int, sex text, diet text, activity text, targets jsonb, created_at timestamptz default now());
create table reports (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users,
  uploaded_at timestamptz default now(), source_type text, storage_path text, parse_status text, consent_scope text);
create table report_markers (id uuid primary key default gen_random_uuid(), report_id uuid references reports,
  marker_id text, value numeric, unit text, range_low numeric, range_high numeric,
  range_source text, flag text, verdict_class text, confidence numeric);
create table logs (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users,
  ts timestamptz default now(), type text, raw_text text, channel text,
  parse jsonb, accepted_as_is boolean, correction jsonb);
create table nudges (user_id uuid, sent_on date, template_id text, opened boolean,
  primary key (user_id, sent_on));                    -- 1/day enforced by PK
-- RLS: user_id = auth.uid() policies on all tables; service-role bypass only on Render
```

## 7. Environment variables

```
# Vercel (public)
VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY / VITE_API_BASE_URL
# Render (secret)
SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY
KRUTRIM_BASE_URL / KRUTRIM_API_KEY
SARVAM_API_KEY
```

## 8. Responsive shell (one app, two layouts)

Breakpoint 640px. Narrow: bottom nav (Home · Week · Assistant-FAB center · Report · You), assistant as bottom sheet — the mobile prototype experience verbatim. Wide: sidebar + persistent composer bar + two-column Today — the web build verbatim. Components, state, and copy file shared; only the shell switches. PWA manifest + service worker (installable; typed logs queue offline per TRD §7).

## 9. Build order (suggested)

1. Supabase project: schema + RLS + anonymous auth on.
2. Render API: JWT middleware → /onboarding + /home with deterministic engine (no AI yet) → deploy.
3. Web app: port v6 screens/tokens, wire onboarding→home against real API.
4. Krutrim: /assistant/exchange text path (intent+parse), confirm flow, toasts.
5. Sarvam STT: MediaRecorder path into the same exchange endpoint.
6. Reports: upload → Krutrim vision → normalizer → flags screen (start with one lab format; fixture fallback keeps the demo safe).
7. TTS toggle, PWA manifest, polish pass against the F7 copy rules.

Each step ships something demoable; the demo never breaks while the next layer lands.

## 10. Doc deltas this stack implies

- TRD §1: client plane = single responsive React web app (PWA), not RN/Flutter.
- TRD §3: TTS row → Sarvam Bulbul behind toggle (Deepgram noted as English-centric alternative, not chosen).
- TRD §2/4.1: STT path is server-side Sarvam via /stt (browser SpeechRecognition was prototype-only).
- PRD F3/F5: "mobile" → "narrow viewports"; everything else holds.
- New honesty line: no app-store presence Phase 1 — and the lab-distribution thesis prefers web anyway (results-SMS → link → zero install at the trigger moment).
```

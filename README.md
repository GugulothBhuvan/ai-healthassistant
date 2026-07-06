# Aarogya

The AI health assistant — see `aarogya-prd-v2-1-final.md` (product spec) and
`aarogya-build-blueprint.md` (stack/architecture) for the full spec this repo implements.

## Layout

```
apps/web       React (Vite) SPA — Vercel
apps/api       Node/Express API — Render
packages/shared  zod schemas + copy-key enum shared FE/BE
supabase/migrations  SQL schema + RLS
```

## Setup

```
npm install
cp apps/api/.env.example apps/api/.env         # fill in real secrets
cp apps/web/.env.example apps/web/.env.local   # fill in real public config
```

Apply the Supabase schema (`supabase/migrations/0001_init.sql`) via the SQL editor or
`supabase db push` once linked to your project, and enable anonymous sign-in under
Authentication → Providers.

## Run locally

```
npm run dev:api   # http://localhost:8787
npm run dev:web   # http://localhost:5173
```

## Build order

Following `aarogya-build-blueprint.md` §9: Supabase schema → API skeleton → web shell →
Krutrim assistant → Sarvam STT → reports → TTS/PWA polish. Each step is independently
runnable.

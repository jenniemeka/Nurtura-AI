# Nurtura AI

Nurtura AI is a gentle, mobile‑first parenting companion that supports caregivers from pregnancy through early childhood. It combines an AI parenting assistant, milestone tracking, curated learning content, short‑form video reels, a community space, and a full **Pregnancy Mode** with antenatal tools.

## Features

### Core parenting
- **Personalized dashboard** – baby age, weekly milestone, suggested reading, feeding / sleep / vaccination reminders, daily encouragement.
- **AI Parenting Assistant** – supportive, non‑diagnostic guidance with suggested prompts and saved conversations.
- **Milestone tracker** – crawl, walk, talk, feed, sleep, weight, height, and vaccinations with a visual timeline and badges.
- **Learn library** – articles plus a searchable “Is this normal?” section.
- **Reels feed** – short vertical videos with category filters and search to quickly find content for your baby’s needs.
- **Community** – groups, posts, comments, and an anonymous mode.
- **Expert creator portal & admin moderation** – verified experts can publish; admins review applications and content.
- **Notifications** – in‑app and scheduled reminders.

### Pregnancy Mode (activated when a user selects “pregnant” during onboarding)
- **Pregnancy dashboard** – week‑by‑week progress calculated from due date, baby growth, and weekly insights.
- **AI Pregnancy Assistant** – week‑aware answers with a mandatory safety disclaimer and red‑flag “when to see a clinician” guidance.
- **Antenatal learning** – nutrition, prenatal exercises, and care articles.
- **Tools** – kick counter, contraction timer, hospital bag checklist.
- **Birth plan builder** – review, edit, export as a shareable PDF, and generate / revoke a shareable link (with confirmation + audit trail).
- **Pregnancy log** – kick counts, contractions, and timer sessions saved to a recent‑history view with trend charts by day/week.
- **Configurable antenatal reminders** – kicks, hydration, appointments, with notification support.

## Tech stack

- **Framework:** TanStack Start v1 (React 19, file‑based routing, SSR + server functions)
- **Build:** Vite 7
- **Styling:** Tailwind CSS v4 with semantic design tokens in `src/styles.css` (cream / lavender / sky / sage / ink, Geist font, soft rounded cards)
- **UI primitives:** shadcn/ui + Radix
- **Data / state:** TanStack Query
- **Backend:** Managed Postgres + Auth + Storage (email/password and Google sign‑in), with Row‑Level Security on every user‑scoped table
- **AI:** Server functions calling a hosted AI gateway (Gemini / GPT family) – no client‑side API keys
- **Deploy target:** Cloudflare Workers (edge)

## Project structure

```
src/
  routes/                file‑based routes (TanStack Start)
    _app/                authenticated app shell (dashboard, ai, tracker,
                         learn, reels, community, pregnancy, profile,
                         expert‑portal, admin, notifications, search)
    share.birth-plan.$token.tsx
    index.tsx, login.tsx, signup.tsx, onboarding.tsx
  lib/                   server functions (*.functions.ts) and helpers
  components/ui/         shadcn components
  integrations/supabase/ auto‑generated DB client & types (do not edit)
  styles.css             design tokens
supabase/migrations/     SQL migrations (RLS, roles, pregnancy tables…)
```

## Getting started

Prerequisites: **Bun** (or npm/pnpm) and Node 20+.

```bash
bun install
bun run dev          # start the dev server
bun run build        # production build
bun run preview      # preview the production build
bun run lint         # eslint
bun run format       # prettier
```

Environment variables are provided automatically via the managed backend (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`). Server‑only secrets (service role key, AI gateway key) are injected at runtime and must never be referenced from client code.

## Architecture notes

- **Server‑side logic** lives in TanStack server functions (`createServerFn`) under `src/lib/*.functions.ts`. Auth‑protected functions use the `requireSupabaseAuth` middleware; the browser attaches the user’s bearer token automatically via `attachSupabaseAuth` registered in `src/start.ts`.
- **Public HTTP endpoints** (webhooks, shareable links) live under `src/routes/api/public/*` or `src/routes/share.*`.
- **Roles** (`admin`, `expert`, `user`) are stored in a dedicated `user_roles` table and checked with a `SECURITY DEFINER` `has_role()` function – never on the profile row.
- **Design system first** – components consume semantic tokens (`bg-card`, `text-ink`, `bg-lavender`, …); no hard‑coded hex values.
- **AI safety** – every Pregnancy Mode response appends a week‑specific safety section and a “not a medical diagnosis” reminder.

## Disclaimer

Nurtura AI provides educational, non‑diagnostic guidance only. It is not a substitute for professional medical advice. For anything urgent or concerning, contact your pediatrician, obstetrician, or local emergency services.

## License

Proprietary – all rights reserved.

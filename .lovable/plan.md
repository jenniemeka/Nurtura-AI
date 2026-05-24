
# Nurtura AI — Build Plan

The spec covers 13 feature areas. To keep quality high I'll build in **3 phases**, each fully working before moving to the next. Phase 1 ships in this iteration; phases 2 and 3 are queued for follow-up turns.

Design tokens come verbatim from the chosen direction: cream `#fdfcfb`, lavender `#f5f3ff`, sky `#f0f9ff`, sage `#f0fdf4`, ink `#18181b`, Geist font, rounded cards, soft shadows, mobile-first.

---

## Phase 1 — Foundation (this iteration)

### Backend
- Enable Lovable Cloud (Postgres + Auth + Storage) and Lovable AI Gateway.
- Auth: email/password + Google sign-in (via Lovable broker). `/login`, `/signup`, `/reset-password` routes.
- Tables: `profiles`, `babies`, `milestones`, `ai_conversations`, `ai_messages`, `articles`, `is_this_normal_topics`, `notifications`. RLS enabled, user-scoped policies.
- Hero images generated for landing.

### Routes (TanStack Start)
- `/` Landing page — built faithfully from the selected prototype (hero, trending guidance reel-card carousel as image cards for now, milestones preview, AI chat preview, category grid, expert creators, app download CTA).
- `/login`, `/signup`, `/reset-password`
- `/onboarding` — parent name, pregnancy stage / baby age, # children, child birthday, top concerns
- `/_authenticated` layout with bottom-tab mobile nav: Home, Tracker, AI, Learn, Profile
  - `/dashboard` — baby age, weekly milestone, suggested articles, feeding/sleep/vaccination reminder cards, daily tip, encouragement message
  - `/ai` — AI parenting assistant chat (streaming via `createServerFn` → Lovable AI Gateway, `google/gemini-3-flash-preview`, supportive system prompt, suggested prompts, saved conversations)
  - `/tracker` — milestone tracker (crawl/walk/talk/feed/sleep/weight/height/vaccinations), timeline, badges
  - `/learn` — articles list + "Is this normal?" searchable section
  - `/learn/$slug` — article detail with related content
  - `/profile` — baby profile, settings

### Why phase here
A working landing + auth + onboarding + dashboard + AI assistant + milestone tracker + learn section delivers the core emotional value. Video reels, community, expert creator portal, premium, and notifications system are deferred to phase 2/3 because each is substantial.

---

## Phase 2 — Engagement (next turn)
- Video reels feed (placeholder vertical videos until hosting is decided)
- Community groups, posts, comments, anonymous mode
- Notifications system (in-app + scheduled reminders)
- Search with AI-powered suggestions

## Phase 3 — Ecosystem (later)
- Expert creator portal (apply, verify, upload, live sessions)
- Premium tier (Stripe via Lovable built-in payments) with personalized AI plans, advanced analytics, expert consultations
- Admin moderation

---

## Technical notes

- Stack stays as scaffolded: TanStack Start v1 + React 19 + Tailwind v4 + shadcn. No Next.js.
- AI calls use `createServerFn` (not Edge Functions) hitting `https://ai.gateway.lovable.dev/v1/chat/completions` with `LOVABLE_API_KEY`. Streaming for chat.
- Mobile-first: every layout designed for ~375px first, scales up. Bottom-tab nav on small screens, sidebar on `lg+`.
- All colors and fonts go through `src/styles.css` design tokens — no hardcoded hex in components.
- SEO: per-route `head()` with unique title/description; `og:image` only on leaf routes that have hero imagery.
- Roles table reserved for phase 3 (expert verification + admin) using the `app_role` + `has_role()` security-definer pattern.

After Phase 1 ships, reply "continue" or name a phase 2/3 feature and I'll keep building.

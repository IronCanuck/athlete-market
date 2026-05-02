# Athlete Market

A Fiverr-style marketplace built for student athletes. Brands, fans, and local businesses can hire athletes for shoutouts, coaching, content, appearances, and more — all booked around the athlete's training, class, and game schedule.

## Stack

- [Next.js 16](https://nextjs.org) (App Router, RSC, Server Actions)
- TypeScript + Tailwind CSS v4
- [Supabase](https://supabase.com) for auth, Postgres, RLS, and realtime messaging
- [lucide-react](https://lucide.dev) icons
- Deployed on Vercel

## Features

- Public marketplace with categorized gigs (social media, coaching, appearances, NIL deals, content shoots, tutoring, and more)
- Athlete onboarding: school, sport, position, academic year, NIL eligibility, weekly availability windows
- Tiered packages per gig (Basic / Standard / Premium) with delivery time + revisions
- Schedule-aware ordering and built-in messaging thread per order (Supabase realtime)
- Buyer protection: orders move through `pending → accepted → delivered → completed`, with reviews unlocked only after completion
- Athlete dashboard: gigs, orders, availability, earnings (10% platform fee, 90% to athlete), profile
- Public athlete profile pages

## Quick start

```bash
npm install
cp .env.example .env.local   # fill in Supabase credentials
npm run dev
```

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. Copy `URL` and `anon public` key into `.env.local`.
3. Push the schema:

   ```bash
   npx supabase login
   npx supabase link --project-ref YOUR-PROJECT-REF
   npx supabase db push
   ```

   The migration in `supabase/migrations/` creates all tables, RLS policies, triggers (auto-create profile on sign-up, refresh review aggregates), and seeds the default categories.

4. Email auth is enabled by default; no extra config required.

## Deploy

Push `main` to GitHub. Vercel will build and deploy automatically. Set the same env vars in Vercel's project settings.

## Project structure

```
src/
  app/
    (auth)/sign-in, sign-up        — public auth pages
    auth/callback, sign-out        — Supabase auth route handlers
    onboarding/athlete             — athlete onboarding flow
    browse                         — search & filter gigs
    gigs/[id]                      — gig detail + package selector + order CTA
    orders/[id]                    — order detail + message thread + actions
    athletes, athletes/[id]        — public athlete profiles
    dashboard/...                  — authenticated dashboard (gigs, orders, messages, availability, earnings, profile)
  components/                      — UI primitives + layout
  lib/supabase                     — browser/server/middleware Supabase clients
  types/db.ts                      — typed DB row shapes
supabase/migrations                — SQL migrations (init schema + seed categories)
```

## NIL & compliance

Athlete Market surfaces a self-attested NIL eligibility flag and encourages athletes to keep all communication on-platform. The schema (`profiles.nil_eligible`, `availability`, `messages`) is designed to make it easy to plug in compliance reviews and audit logs.

## License

MIT

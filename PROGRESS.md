# PROGRESS — Supplier ESG Register

> Claude Code: read this file at the start of every session, before touching
> anything. Update it at every save point. Replace content — do not append.
> History lives in git.

**Session:** 1 — in progress
**Last updated:** 31 July 2026
**Live URL:** none yet

## Current state
Auth fully configured, users + roles set, 14 suppliers seeded. Ready to deploy to Netlify.
Backend + frontend built. Supabase project `esg-resource-pilot` (ref `hulgunguwjhxsgdhinrm`) healthy with all three tables (RLS on), the production-control column restriction (suppliers_pc view + column-guard trigger), append-only change_log trigger, generated overall_score, auth signup trigger. Frontend is a complete Vite + React + Tailwind app (sign-in, supplier list, detail, user management, archive, CSV export) that builds cleanly and is wired to the live backend. The security-critical acceptance criteria were verified directly against the database (see Last session). Tables are empty — no users invited, no suppliers seeded, no email/Netlify config yet.

## Last session
Session 1: session-start checks; First Session Setup; created the Supabase project; applied 4 migrations (full schema, RLS, view, triggers); built the entire frontend and confirmed `npm run build` passes. Ran database-level RLS verification simulating all four roles — PASS on acceptance #6 (sustainability blocked from commercial fields), #7 (purchasing blocked from scores), #8 (PC base table 0 rows / view 1 row), #9 (PC insert blocked), #12 (PC change-log shows only 7 permitted fields), #13 (admin cannot alter change_log), #15 (non-archived delete blocked, archived delete allowed, 14 change_log rows retained), #16 (purchasing sees only own profile); positive edits for sustainability/purchasing succeed. All test fixtures cleaned up (0 rows).

## Remaining work
- [x] First Session Setup
- [x] Create Supabase project "esg-resource-pilot" via MCP
- [x] Build all tables, RLS, column restriction, change_log trigger; write docs/supabase-setup.md
- [x] Build Sign-in, Supplier List, Supplier Detail, User Management, Archive
- [x] Wire Export arm: CSV from the permission-filtered source, restricted columns absent
- [x] Database-level verification of the security-critical acceptance criteria (6–9, 12, 13, 15, 16)
- [x] BUILDER: Brevo account + domain authenticated (lcaresource.com, DKIM+DMARC verified), SMTP key collected
- [x] Supabase Auth config (dashboard): custom SMTP (Brevo, from rebecca@lcaresource.com, port 587), self-signup disabled, Magic Link template emits the six-digit `{{ .Token }}`
- [x] Users created (auto-confirmed) and roles assigned: lcaresource.pilot@gmail.com=admin, rebecca@lcaresource.com=admin, +purchasing=purchasing, +sustainability=sustainability, +production=production_control. Demo uses Gmail plus-addressing so all codes land in lcaresource.pilot@gmail.com
- [x] Seeded 14 suppliers from docs/suppliers-seed.csv (change_log trigger disabled during seed so history starts empty; overall_score generated, not seeded)
- [ ] Wire Scheduled arm: Netlify scheduled function, daily 07:00 US Eastern, composes the change digest via Brevo — sends nothing on days with no changes (never to production control)
- [ ] Local/deployed end-to-end test pass — sign in as all four roles and walk every view
- [ ] Full acceptance criteria pass incl. #1–5, #10, #11, #14, #17–20
- [ ] BUILDER: connect Netlify to the repo, add environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY), deploy from main

## Build decisions
- Column-level restriction for production control implemented two ways: a `suppliers_pc` view (security_invoker=false, safe columns only) for reads, and a BEFORE UPDATE column-guard trigger for writes — because all logged-in users share one Postgres `authenticated` role, so per-role column GRANTs are impossible.
- `overall_score` is a GENERATED STORED column `round((e+s+g)/3.0,1)` — enforces "derived, never entered, never seeded" and yields null when any pillar is null, for free.
- change_log is written only by an AFTER INSERT/UPDATE trigger; no write policy exists for any role (append-only incl. admin), and direct write grants revoked.
- New auth users get a profiles row via trigger, defaulting to `production_control` (least privilege); admin reassigns. First admin must be set manually in SQL (see docs/supabase-setup.md).
- The `security_definer_view` advisor ERROR on suppliers_pc is a reviewed, accepted exception — it is the column-restriction mechanism itself.

## Known issues
- Tool name "Supplier ESG Register" was proposed and accepted by default, never explicitly confirmed — cosmetic, changeable any time
- internal_notes editable by both purchasing and sustainability was inferred, not stated by the builder — confirm during the build
- change_log is immutable for every role including admin, deliberately tightening "admin has full access" — the builder may overturn this, but it weakens the central demonstration
- contract_status value list (Active, In renewal, Under review, Expired) is proposed, not confirmed by the builder
- Supabase Free plan pauses after roughly a week without traffic; the builder wakes the project before demos

## Notes for next session
- The app runs locally with a gitignored `.env.local` (already created with the project URL + publishable key). To run it: `npm install` then `npm run dev`. But login won't work until Supabase Auth SMTP (Brevo) is configured and at least one user is invited.
- Next natural build step (no builder credentials needed): the Netlify scheduled digest function and seeding the 14 suppliers from docs/suppliers-seed.csv.
- Seeding needs a role that can insert (admin/purchasing/sustainability) via the app or a service-role script — the base table insert has no column restriction, so a one-off seed with full columns is fine.

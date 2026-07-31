# PROGRESS — Supplier ESG Register

> Claude Code: read this file at the start of every session, before touching
> anything. Update it at every save point. Replace content — do not append.
> History lives in git.

**Session:** 1 — in progress
**Last updated:** 31 July 2026
**Live URL:** none yet

## Current state
Backend built. Supabase project `esg-resource-pilot` (ref `hulgunguwjhxsgdhinrm`) created and healthy. All three tables (profiles, suppliers, change_log) with RLS enabled, the production-control column restriction (suppliers_pc view + column-guard trigger), the append-only change_log trigger, generated overall_score, and auth signup trigger are in place and verified. docs/supabase-setup.md written. No frontend code yet; no users invited yet.

## Last session
Session 1: session-start checks (spec v1.0 matches CLAUDE.md); First Session Setup (moved spec + seed files into docs/); created the Supabase project via MCP; applied 4 migrations building the full schema, RLS, views, triggers; verified overall_score (4.0 and null cases) and the change_log trigger with throwaway rows; hardened function exposure per advisors; wrote docs/supabase-setup.md.

## Remaining work
- [x] First Session Setup: create docs/, move product-spec.md, seed-data-pack.md and suppliers-seed.csv into it, commit (see CLAUDE.md Session Protocol)
- [x] Create Supabase project "esg-resource-pilot" via MCP
- [x] Build all tables, RLS policies, the column-level restriction for production control, the change_log trigger, then write docs/supabase-setup.md
- [ ] Auth configuration in the Supabase dashboard: custom SMTP (Brevo), disable self-registration, change the login email template to emit the six-digit code — needs builder's Brevo SMTP credentials
- [ ] Scaffold the frontend (Vite + React + Tailwind), Supabase client in src/lib
- [ ] Configure Supabase Auth SMTP with the builder's Brevo credentials, and change the login email template to send a six-digit code instead of a clickable link
- [ ] Builder: invite all four users from the Supabase dashboard (Authentication → Users → Invite), then assign roles to the resulting profile rows — this cannot be seeded from a file
- [ ] Build Sign-in — email field, then six-digit code entry, neutral failure message
- [ ] Build Supplier List — sortable, filterable register with visible role indicator and CSV export
- [ ] Build Supplier Detail — role-dependent editable fields, filtered change history, archive action
- [ ] Build User Management (admin only) — invite users, assign and change roles
- [ ] Build Archive (admin only) — restore, and permanent delete behind a named confirmation
- [ ] Wire Export arm: CSV generated from the permission-filtered source, restricted columns absent
- [ ] Wire Scheduled arm: Netlify scheduled function, daily 07:00 US Eastern, composes the change digest and sends via Brevo — sends nothing on days with no changes
- [ ] Seed the suppliers table from docs/suppliers-seed.csv — do not seed overall_score or change_log
- [ ] Local test pass — sign in as all four roles and walk every view
- [ ] Acceptance criteria pass — verify every criterion in spec Section "Acceptance Criteria" before deploy, with particular attention to numbers 6 through 13
- [ ] Deploy to Netlify — builder connects the repo and adds environment variables in the Netlify dashboard

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
None.

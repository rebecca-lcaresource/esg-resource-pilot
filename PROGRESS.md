# PROGRESS — Supplier ESG Register

> Claude Code: read this file at the start of every session, before touching
> anything. Update it at every save point. Replace content — do not append.
> History lives in git.

**Session:** 1 — in progress
**Last updated:** 31 July 2026
**Live URL:** none yet

## Current state
First Session Setup done: docs/ created, product-spec.md, seed-data-pack.md and suppliers-seed.csv moved into it. No application code or Supabase project yet.

## Last session
Session 1: ran session-start checks (spec v1.0 matches CLAUDE.md), performed First Session Setup — moved the spec and seed files into docs/. Awaiting builder input on Supabase project creation and credentials before build work.

## Remaining work
- [x] First Session Setup: create docs/, move product-spec.md, seed-data-pack.md and suppliers-seed.csv into it, commit (see CLAUDE.md Session Protocol)
- [ ] Create Supabase project "esg-resource-pilot" via MCP — confirm the name with the builder first
- [ ] Build all tables, RLS policies, the column-level restriction for production control, the change_log trigger and Auth configuration, then write docs/supabase-setup.md
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
None yet.

## Known issues
- Tool name "Supplier ESG Register" was proposed and accepted by default, never explicitly confirmed — cosmetic, changeable any time
- internal_notes editable by both purchasing and sustainability was inferred, not stated by the builder — confirm during the build
- change_log is immutable for every role including admin, deliberately tightening "admin has full access" — the builder may overturn this, but it weakens the central demonstration
- contract_status value list (Active, In renewal, Under review, Expired) is proposed, not confirmed by the builder
- Supabase Free plan pauses after roughly a week without traffic; the builder wakes the project before demos

## Notes for next session
None.

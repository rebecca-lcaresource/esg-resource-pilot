# PROGRESS — Supplier ESG Register

> Claude Code: read this file at the start of every session, before touching
> anything. Update it at every save point. Replace content — do not append.
> History lives in git.

**Session:** 2 — in progress (branch `claude/auth-demo-sidebar-ufzup4`)
**Last updated:** 2 August 2026
**Live URL:** https://supplier-esg-register.netlify.app

## Current state
LIVE AND WORKING. Deployed to Netlify and login works end-to-end: builder signed in successfully as admin with an emailed one-time code. Supabase project `esg-resource-pilot` (ref `hulgunguwjhxsgdhinrm`) healthy — all three tables (RLS on), production-control column restriction (suppliers_pc view + column-guard trigger), append-only change_log trigger, generated overall_score, auth signup trigger. Frontend is a complete Vite + React + Tailwind app (sign-in, supplier list, detail, user management, archive, CSV export). Auth configured (Brevo SMTP, invite-only), 5 users with roles assigned, 14 suppliers seeded. Security-critical acceptance criteria verified at the DB level. Not yet done: role-by-role walkthrough, remaining acceptance criteria, the daily digest function.

## Last session
Session 1 (full build in one session): created Supabase project + schema/RLS/triggers; built and deployed the frontend; verified the security-critical RLS criteria at the DB level; walked the builder through Brevo SMTP, Supabase auth config, user creation + roles, and Netlify deployment. Debugged live login via Supabase auth logs + Brevo logs: root causes were (1) wrong SMTP username initially (fixed to b3e1ab001@smtp-brevo.com), (2) codes landing in Gmail Promotions tab, (3) the project issues 8-DIGIT OTP codes but the UI field was capped at 6 (fixed to accept the full length). Builder confirmed everything working. Netlify required MANUAL "Trigger deploy" each push (auto-deploy not firing — needs investigation).

## Remaining work
- [x] First Session Setup
- [x] Create Supabase project "esg-resource-pilot" via MCP
- [x] Build all tables, RLS, column restriction, change_log trigger; write docs/supabase-setup.md
- [x] Build Sign-in, Supplier List, Supplier Detail, User Management, Archive
- [x] Wire Export arm: CSV from the permission-filtered source, restricted columns absent
- [x] Database-level verification of the security-critical acceptance criteria (6–9, 12, 13, 15, 16)
- [x] BUILDER: Brevo account + domain authenticated (lcaresource.com, DKIM+DMARC verified), SMTP key collected
- [x] Supabase Auth config (dashboard): custom SMTP (Brevo, from rebecca@lcaresource.com, port 587), self-signup disabled, Magic Link template emits the `{{ .Token }}` OTP (8-digit)
- [x] Users created (auto-confirmed) and roles assigned: lcaresource.pilot@gmail.com=admin, rebecca@lcaresource.com=admin, +purchasing=purchasing, +sustainability=sustainability, +production=production_control. Demo uses Gmail plus-addressing so all codes land in lcaresource.pilot@gmail.com
- [x] Seeded 14 suppliers from docs/suppliers-seed.csv (change_log trigger disabled during seed so history starts empty; overall_score generated, not seeded)
- [x] BUILDER: connected Netlify to the repo, added env vars (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY), deployed from main → https://supplier-esg-register.netlify.app
- [x] Live login verified — admin signed in via emailed 8-digit code (acceptance #1 effectively confirmed)
- [x] Magic Link email template wording "8-digit" — CONFIRMED by builder in the Supabase dashboard (Auth → Emails → Templates → Magic Link). UI and docs already say 8-digit. Done.
- [ ] Investigate why Netlify auto-deploy isn't firing on push to main (currently needs manual Trigger deploy each time)
- [x] `docs/authorization-proof.md` — copy-paste SQL that impersonates each role in the Supabase SQL Editor and shows the DB granting/refusing access (reads + column-level write blocks + append-only change_log), all in rolled-back transactions. Verified live 2 Aug 2026. Demo "receipts" for a technical audience.
- [x] In-app Demo Walkthrough sidebar — a slide-out presenter aid on every screen (incl. sign-in) listing the auth → authorization steps, with per-step check-off and localStorage-persisted progress (`src/components/DemoWalkthrough.jsx`, mounted in `App.jsx`). Presenter aid only — no data access, grants nothing; DB remains the sole enforcement.
- [ ] Role-by-role walkthrough with the builder — show the same supplier rendered differently per role (the core demonstration; the new sidebar scripts this end to end)
- [ ] Wire Scheduled arm: Netlify scheduled function, daily 07:00 US Eastern, composes the change digest via Brevo — sends nothing on days with no changes (never to production control)
- [ ] Full acceptance criteria pass incl. #2–5, #10, #11, #14, #17–20
- [ ] Sign in as all four roles in the live app and walk every view

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
- RESOLVED (was a spec deviation): the project issues 8-DIGIT email OTP codes. Standardised on 8-digit everywhere — Supabase auth, email template (builder-confirmed), UI, and the spec itself (product-spec.md + CLAUDE.md wording corrected in Session 2, spec version intentionally NOT bumped as it's a wording fix, not a revision).
- Netlify does not auto-deploy on push to main — each deploy needs a manual "Trigger deploy → Clear cache and deploy site". INVESTIGATION (Session 2): `netlify.toml` confirmed clean — correct build command/publish dir, NO `build.ignore` script, SPA redirect fine — so the repo side is NOT the cause. Cause is the Netlify↔GitHub link (dashboard). Ranked suspects to check: (1) Netlify GitHub App lost access to `rebecca-lcaresource/esg-resource-pilot` / webhook not delivering — most common cause of "must trigger every time"; fix by reconnecting the repo / reinstalling the GitHub App with repo access. (2) "Stop auto publishing" toggled on (Site config → Build & deploy → Continuous deployment). (3) Production branch ≠ `main` (Site config → Build & deploy → Branches). (4) Deploys locked. Manual trigger still works, so demos are unaffected.
- Login codes land in Gmail's Promotions tab (deliverability is fine; just categorization). Builder can drag one to Primary to train Gmail.

## Notes for next session
- The app is LIVE at https://supplier-esg-register.netlify.app. Session 2 merged to main the in-app Demo Walkthrough sidebar (right-edge "Demo guide" tab, every screen incl. sign-in) + the authorization-proof docs. NOTE: the sidebar only appears after a Netlify deploy — auto-deploy is broken, so the builder must Trigger deploy manually to see it live.
- PRIORITY NEXT SESSION (builder request): install the Impeccable design skill — Apache-2.0, github.com/pbakaus/impeccable — via `npx impeccable install` then `/impeccable init`. Wire the existing brand rules (palette #1E3A5F / #2E7D7B, Inter, no gradients, dense-corporate) into its DESIGN.md as the AUTHORITATIVE brief, so it refines within the identity rather than redesigning bold/marketing-style (Impeccable's "dream big and bold, award-caliber" ethos conflicts with the CLAUDE.md brand mandate "reads as a working internal system, not a marketing page"). Do a controlled polish pass on ONE screen first for builder review before touching all screens. Fresh branch; never right before a demo.
- The role-by-role walkthrough the builder was owed is now delivered in-app by the Demo guide sidebar — no manual login-per-role narration needed, though the live demo still signs in as each role.
- Netlify auto-deploy: repo side confirmed clean (see Known issues); investigate the dashboard Netlify↔GitHub link — most likely the Netlify GitHub App lost repo access / webhook not delivering. Reconnect the repo or reinstall the GitHub App with access to rebecca-lcaresource/esg-resource-pilot, then push a trivial commit to confirm an auto-build fires.
- Remaining build: the daily digest Netlify scheduled function (Brevo, 07:00 US Eastern, skip empty days, never to production control). Needs BREVO_SMTP_* + SUPABASE_SERVICE_ROLE_KEY as Netlify env vars.
- Then a full acceptance-criteria pass (esp. #10 CSV per role, #11 change log on real edits, #14 archive, #17/18 digest).
- Reminder: to deploy after code changes, push to main then MANUALLY Trigger deploy in Netlify until auto-deploy is fixed.

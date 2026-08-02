# Supplier ESG Register

## Identity
An internal supplier sustainability register where purchasing, sustainability, production control and an administrator hold different read and edit rights over the same supplier records, accessed by invitation only with a 8-digit email code.
Tier: 3 — login required, and different roles see and edit different things, with data persisting to Supabase (D3+A3)
Spec version governed: v1.0 — the version of docs/product-spec.md these rules were derived from.
Position: Standalone

## Session Protocol
At the start of every session:
1. Pull the latest from main before reading anything else.
2. Check docs/product-spec.md: if its version is newer than the "Spec version governed" line in this file, STOP. Tell the builder: "The spec has changed since this CLAUDE.md was written — re-run the Project Governor on the revised spec before building, or these rules may contradict it." Do not build against a stale CLAUDE.md.
3. Read PROGRESS.md in the project root — it is the current state of this build. If it is missing, recreate it with the structure at the end of this section, then continue.
4. Increment the session number and update the date in PROGRESS.md.
5. If "Notes for next session" has content: repeat the notes back to the builder, treat them as this session's priorities, then clear the section.
6. If this is session 1, run First Session Setup below before any build work.

Save point — after completing any module, feature, fix, or schema change:
1. Update PROGRESS.md: current state, remaining work, build decisions, known issues.
2. If the database was touched (any table, policy, bucket, or auth change), update docs/supabase-setup.md in the same save point.
3. Commit and push to main.
4. Tell the builder in one line: "Save point committed: [what changed]."
Do not start the next piece of work before the save point is pushed. Never end a session without one — an ending session is a save point.

First Session Setup (session 1 only):
1. Create docs/ and move product-spec.md into it. Move seed-data-pack.md and suppliers-seed.csv into docs/ as well.
2. Announce what moved, then commit and push before building anything.

PROGRESS.md structure (for the recreate rule): status header (Session / Last updated / Live URL), Current state, Last session (3–5 lines, replace each session), Remaining work (shrinking checklist), Build decisions (one line each), Known issues, Notes for next session.

## Commands
```
npm install
npm run dev
npm run build
```

## Tech Stack
React · Vite · Tailwind CSS · Netlify · Supabase · Brevo (SMTP)
Deployment: GitHub → Netlify, auto-deploys from main. Netlify MCP is not active — the builder connects the repo and enters environment variables in the Netlify dashboard; remind them before the first deploy.

## Arms
Email (login codes) — no function required — Supabase Auth sends natively via custom SMTP — fires when a user requests a code → that user
Email (daily digest) — database-triggered content, sent from a Netlify scheduled function — fires daily → all admin, purchasing and sustainability users — never to production control
Export — browser only, no server function — CSV, generated from the permission-filtered source
Scheduled — Netlify scheduled function — daily at 07:00 US Eastern — reads the previous 24 hours of change_log, composes one digest, sends it; sends nothing at all when there were no changes

## Environment Variables
VITE_SUPABASE_URL — Supabase: Project Settings → API → Project URL — Netlify env var
VITE_SUPABASE_ANON_KEY — Supabase: Project Settings → API → anon / public key — Netlify env var
SUPABASE_SERVICE_ROLE_KEY — Supabase: Project Settings → API → service_role key — Netlify env var — scheduled digest function only
BREVO_SMTP_HOST — smtp-relay.brevo.com — Netlify env var — scheduled digest function
BREVO_SMTP_PORT — 587 — Netlify env var — scheduled digest function
BREVO_SMTP_LOGIN — Brevo dashboard → SMTP & API → SMTP tab — Netlify env var — scheduled digest function
BREVO_SMTP_KEY — Brevo dashboard → SMTP & API → generated SMTP key (not the API key) — Netlify env var — scheduled digest function

Key storage follows function placement: Netlify Functions and scheduled functions read Netlify environment variables. Supabase Edge Functions read Supabase Edge Function secrets — they CANNOT read Netlify environment variables. A key in the wrong store fails silently at runtime. At session start, confirm these exist before first use; prompt the builder for any that are missing. No value ever appears in code or in any file committed to GitHub.

The Brevo credentials are additionally entered by the builder into the Supabase dashboard under Authentication → SMTP Settings, so Supabase Auth can send login codes. That is dashboard configuration, not an environment variable, and never belongs in a file.

## Supabase
Project: "esg-resource-pilot" — does not exist yet. At the start of session 1, confirm this name with the builder, then create the project via Supabase MCP before building anything. Region: nearest to users (GDPR does not apply). Plan: Free — pauses after ~1 week without traffic; the builder wakes it before demos.

Build this schema — authoritative until docs/supabase-setup.md exists:
profiles: id (FK to auth.users), full_name, email, role (enum: admin, purchasing, sustainability, production_control), created_at
suppliers: supplier_name, country, category, esg_report_url, score_e (int 1–5, nullable), score_s (int 1–5, nullable), score_g (int 1–5, nullable), score_justification, internal_notes, contract_status, contract_renewal_date, annual_spend, is_archived (default false), created_at, updated_at
change_log: supplier_id (FK to suppliers), supplier_name_snapshot, field_name, old_value, new_value, changed_by (FK to profiles), changed_at

change_log is written only by a database trigger on suppliers — one row per changed field, never per save. supplier_name_snapshot is denormalised so history stays readable after a supplier is permanently deleted; log rows are retained on delete, never cascaded away.

RLS — build these policies, never skip:
profiles: anon: no access. Admin: full read and write on all rows. All other roles: read own row only, and no role may ever update its own role.
suppliers: anon: no access. Admin: read and update all columns, plus delete where is_archived is true. Sustainability: read all columns; update score_e, score_s, score_g, score_justification, internal_notes, is_archived and the identity fields only; insert allowed; no delete. Purchasing: read all columns; update contract_status, contract_renewal_date, annual_spend, internal_notes, is_archived and the identity fields only; insert allowed; no delete. Production control: read a restricted column set only — supplier_name, country, category, esg_report_url, score_e, score_s, score_g, updated_at — and no insert, update or delete.
change_log: anon: no access. Admin, purchasing, sustainability: read all rows. Production control: read only rows whose field_name is one of the columns that role may read. No role may insert, update or delete — including admin.

Production control's restriction is a COLUMN restriction, not a row restriction. Implement it with a database view exposing only the permitted columns and/or column-level GRANTs on suppliers. Hiding fields in the React component is not acceptable as the only control.

Auth: email one-time code (8-digit), invite-only. Self-registration must be disabled. Implement by modifying the Supabase magic-link email template to emit the token instead of the confirmation URL, with a code entry field in the UI. Do not ship a clickable magic link — enterprise mail scanners consume single-use links before the recipient clicks them.
Roles: admin, purchasing, sustainability, production_control — stored on profiles.role.
Profiles cannot be seeded from a file: each row must reference a real auth.users id. The builder invites all four users from the Supabase dashboard mid-build, then roles are assigned to the resulting rows.

After setup, write docs/supabase-setup.md and update it at every save point that touches the database. It must contain: project name, project ID, project URL, plan, every table with field names and types, RLS policies per table, auth configuration, notes for future sessions, and a last-updated line with date and session number. From the moment it exists, that file is the schema source of truth.

## Hard Rules
- API keys never in any frontend file or GitHub commit. Storage follows function placement: Netlify env vars for Netlify Functions, Supabase Edge Function secrets for Supabase Edge Functions — Edge Functions cannot read Netlify env vars. Always called through a server-side function.
- Netlify Identity: never. Supabase Auth is the only authentication system in this stack.
- RLS: never disabled on any table. If a query fails, fix the policy or the query — never disable RLS to work around it.
- Supabase service role key required for the daily digest scheduled function, which must read change_log across all users to compose the digest. Stored as SUPABASE_SERVICE_ROLE_KEY in Netlify environment variables, never in code. It bypasses all RLS. It is used by that function and nothing else — never in the frontend, never in any user-facing path.
- The change log is append-only for every role, including admin. No update path, no delete path, no exception. An audit trail its administrator can rewrite is not an audit trail, and in this tool that restriction is the point.
- Every route that reads or writes restricted data must be enforced by the database. Routing, redirects and conditional rendering are convenience, never control. A production control user inspecting network traffic must find no justification, internal notes, contract status, renewal date or annual spend anywhere in the response payload.
- The CSV export reads from the same permission-filtered source as the on-screen table. Restricted columns are absent from the file, not blank.
- The daily digest never goes to production control. If a recipient is ever added, digest content must be filtered by that recipient's role first.

## Project Structure
```
/                     ← root: CLAUDE.md, PROGRESS.md only
/src
  /components
  /lib                ← Supabase client, utilities
/netlify/functions    ← scheduled digest function
/docs                 ← product-spec.md, supabase-setup.md, seed-data-pack.md, suppliers-seed.csv
/public/assets
```

## Brand
No brand skill yet. These inline rules apply until one is added to the repo (then install it as a project skill and defer to it):
- Background: white or near-white · Primary: #1E3A5F · Accent: #2E7D7B · Warning: #B45309 · Low score: #991B1B
- Font: Inter for all text
- No gradients. No decorative illustration. Dense, professional, corporate — it should read as a working internal system, not a marketing page.
- The signed-in user's name and role must be visible and persistent on every screen. This is a functional requirement, not decoration: the tool exists to demonstrate that two people see different things.

## Business Rules
- Overall score = (score_e + score_s + score_g) / 3, rounded to one decimal place. All three pillars weighted equally.
- If any one pillar score is missing, overall_score is null and displays as an em dash — never an average of the available pillars, never 0.0.
- Sorting by overall score places unscored suppliers last regardless of sort direction. Null is never treated as zero.
- Score inputs are integers 1–5 inclusive, enforced at both the form and a database constraint.
- overall_score is derived, never entered, never editable by any role, and never seeded.
- Archiving sets is_archived to true. Only admin can permanently delete, and only a supplier already archived. Permanent deletion retains that supplier's change_log rows.
- contract_status uses a fixed list: Active, In renewal, Under review, Expired.
- The daily digest sends nothing at all on days with no changes.

Out of scope — do not build:
- PDF export
- AI drafting or summarising of ESG reports
- Weighted E/S/G scoring
- Plant or site based row filtering for production control
- Immediate per-change notification

## Reference Docs
Read before building the related part:
- docs/product-spec.md — full module specs, UI sections, logic, arm detail, acceptance criteria
- docs/supabase-setup.md — schema source of truth (created in session 1)
- docs/seed-data-pack.md — seeding rules, what is real and what is invented, the two null test rows
- docs/suppliers-seed.csv — the fourteen supplier rows
PROGRESS.md in the root is read at every session start per the Session Protocol.

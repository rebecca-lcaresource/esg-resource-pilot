# Supabase Setup — Supplier ESG Register

> Schema source of truth. Update this file at every save point that touches the
> database (any table, policy, view, function, trigger, bucket or auth change).

**Last updated:** 2 August 2026 — Session 2

---

## Project

| Detail | Value |
|--------|-------|
| Project name | `esg-resource-pilot` |
| Project ID / ref | `hulgunguwjhxsgdhinrm` |
| Organization | LCA Resource LLC (`sepzvnivoztzyjscvhpd`) |
| Project URL | `https://hulgunguwjhxsgdhinrm.supabase.co` |
| Region | `us-east-1` (US East) |
| Plan | Free — pauses after ~1 week without traffic; wake it the day before a demo |

**Keys** (never committed — copy from Supabase dashboard → Project Settings → API):
- `VITE_SUPABASE_URL` = the Project URL above
- `VITE_SUPABASE_ANON_KEY` = anon / publishable key (browser-safe)
- `SUPABASE_SERVICE_ROLE_KEY` = service_role key (server-side digest function only; bypasses RLS)

---

## Enums

- `public.user_role` = `admin` · `purchasing` · `sustainability` · `production_control`

---

## Tables

### `public.profiles` — one row per user, linked to `auth.users`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | FK → `auth.users(id)` on delete cascade |
| full_name | text | |
| email | text | |
| role | user_role | NOT NULL, default `production_control` (least privilege) |
| created_at | timestamptz | default now() |

- A profile row is created automatically on `auth.users` insert by the `handle_new_user`
  trigger, defaulting to `production_control`. The admin assigns the real role afterwards.
- **The first admin must be set manually** (no admin exists to promote the first one):
  `update public.profiles set role = 'admin' where email = '<admin email>';`

### `public.suppliers` — one row per supplier
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | default gen_random_uuid() |
| supplier_name | text | NOT NULL |
| country | text | NOT NULL |
| category | text | NOT NULL |
| esg_report_url | text | nullable |
| score_e | int | CHECK 1–5, nullable |
| score_s | int | CHECK 1–5, nullable |
| score_g | int | CHECK 1–5, nullable |
| overall_score | numeric(2,1) | **GENERATED** `round((e+s+g)/3.0, 1)` STORED — null if any pillar null; never entered/editable/seeded |
| score_justification | text | nullable |
| internal_notes | text | nullable |
| contract_status | text | CHECK in (`Active`,`In renewal`,`Under review`,`Expired`), nullable |
| contract_renewal_date | date | nullable |
| annual_spend | numeric | nullable |
| is_archived | boolean | NOT NULL, default false |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now(), maintained by `set_updated_at` trigger |

### `public.change_log` — append-only, one row per changed field
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | default gen_random_uuid() |
| supplier_id | uuid | FK → `suppliers(id)` **on delete set null** (history survives permanent delete) |
| supplier_name_snapshot | text | NOT NULL — denormalised so history stays readable after delete |
| field_name | text | NOT NULL |
| old_value | text | nullable |
| new_value | text | nullable |
| changed_by | uuid | FK → `profiles(id)` on delete set null |
| changed_at | timestamptz | NOT NULL, default now() |

### `public.suppliers_pc` — VIEW (production control read path)
Exposes **only** permitted columns of **active** suppliers:
`id, supplier_name, country, category, esg_report_url, score_e, score_s, score_g, overall_score, updated_at`
where `is_archived = false`. Defined `WITH (security_invoker = false)` so it runs as owner
and bypasses base-table RLS — production control has **no** SELECT policy on the base
`suppliers` table, so restricted columns can never appear in a payload they receive.
`SELECT` granted to `authenticated` only.

---

## Functions & triggers

| Object | Purpose |
|--------|---------|
| `current_user_role()` | SECURITY DEFINER; returns caller's role from `profiles` (used inside RLS policies). EXECUTE for `authenticated` only. |
| `handle_new_user()` | Trigger on `auth.users` AFTER INSERT — creates a `profiles` row (default `production_control`). |
| `prevent_self_role_change()` | Trigger on `profiles` BEFORE UPDATE — blocks any user (incl. admin) changing their own role. |
| `set_updated_at()` | Trigger on `suppliers` BEFORE UPDATE — refreshes `updated_at`. |
| `enforce_supplier_column_permissions()` | Trigger on `suppliers` BEFORE UPDATE — **column-level write control**: rejects sustainability edits to commercial fields and purchasing edits to scores/justification. |
| `log_supplier_changes()` + `cl_write()` | Trigger on `suppliers` AFTER INSERT/UPDATE — writes one `change_log` row per changed business field. Derived/automatic fields (overall_score, created_at, updated_at) are not logged. |

All trigger/helper functions have EXECUTE revoked from `anon`/`authenticated`/`public`
(except `current_user_role`, which `authenticated` needs for RLS); triggers still run them.

---

## RLS policies

RLS is **enabled on all three tables**. `anon` has no policy anywhere → no access.

### `profiles`
- SELECT: own row, or admin reads all.
- INSERT / UPDATE / DELETE: admin only. Plus the self-role-change trigger blocks role self-edits for everyone.

### `suppliers`
- SELECT: admin / purchasing / sustainability read all rows & columns. **Production control has no base-table SELECT policy** — it reads `suppliers_pc`.
- INSERT: admin / purchasing / sustainability.
- UPDATE: admin / purchasing / sustainability (row-level); **column-level** limits enforced by the `enforce_supplier_column_permissions` trigger:
  - sustainability may edit scores, justification, internal_notes, is_archived, identity fields; **not** commercial fields.
  - purchasing may edit contract_status, renewal_date, annual_spend, internal_notes, is_archived, identity fields; **not** scores/justification.
- DELETE: admin only, and only where `is_archived = true`.

### `change_log`
- SELECT: admin / purchasing / sustainability read all. Production control reads only rows whose `field_name` is a column it may read (`supplier_name, country, category, esg_report_url, score_e, score_s, score_g, overall_score, updated_at`).
- INSERT / UPDATE / DELETE: **no policy for any role, including admin** — append-only, written solely by the trigger (SECURITY DEFINER). Direct write grants also revoked from `anon`/`authenticated`.

---

## Auth configuration

- Method: email one-time **8-digit** code, **invite-only**. Self-registration must be disabled
  (Dashboard → Authentication → Providers/Settings). (Spec, UI, email template and docs all say
  8-digit — the earlier "six-digit" wording was corrected in product-spec.md and CLAUDE.md,
  Session 2, no version bump.)
- Modify the magic-link email template to emit `{{ .Token }}` (the 8-digit code) instead of
  the confirmation URL. Do **not** ship a clickable link.
- Custom SMTP (Brevo) entered in Dashboard → Authentication → SMTP Settings, from-address on
  the authenticated domain (e.g. `no-reply@<domain>`). Raise the auth email rate limit above
  the default 30/hour if needed.
- Users are invited from the dashboard; `handle_new_user` creates their profile; admin assigns roles.

---

## Demonstrating the authorization — the four-block proof (A1 → A2 → B1 → B3)

The full impersonation script lives in `docs/authorization-proof.md` — copy-paste
SQL for the Supabase SQL Editor that pretends to be each role and shows the
database granting or refusing access. Every block runs inside `begin … rollback`,
so running it changes nothing.

For a live demo you do not need all of it. Four blocks, **run in this order**,
tell the whole story — each is one sentence you say out loud as the result
appears:

| Order | Block | What you run | What the database does | The line to say |
|-------|-------|--------------|------------------------|-----------------|
| 1 | **A1** | Production Control counts rows in `suppliers` vs the `suppliers_pc` view | base table → **0 rows**; view → 14 | "It can't see the data." |
| 2 | **A2** | Production Control lists the columns it actually receives | 10 safe columns — no `score_justification`, `internal_notes`, `contract_status`, `contract_renewal_date`, `annual_spend` | "The columns aren't even there." |
| 3 | **B1** | Purchasing tries to change an ESG score | **rejected** with an error | "It can't edit a score." |
| 4 | **B3** | Admin tries to insert a `change_log` row | **rejected** with an error | "Not even the admin can rewrite the log." |

**Why this order.** It climbs deliberately: the *least*-privileged user is first
fenced out of **reading** (rows in A1, then columns in A2), then **writing** is
blocked by separation of duties (B1), and it finishes on the strongest point —
the *most*-privileged user, the admin, cannot alter the **audit log** (B3). Each
beat is enforced by a **different** mechanism, so together they show the model is
not one trick with one possible bypass:

- **A1** — Production Control has no `SELECT` policy on the base `suppliers` table (RLS returns 0 rows).
- **A2** — it can read suppliers only through the `suppliers_pc` view, which exposes safe columns of active rows only.
- **B1** — the `enforce_supplier_column_permissions` BEFORE UPDATE trigger blocks the write (column-level control; not visible in `pg_policies`).
- **B3** — `change_log` has no insert/update/delete policy for any role, and direct write grants are revoked; it is written solely by the `log_supplier_changes` trigger (append-only, even for admin).

Verified live against the project on 2 August 2026. To reproduce, open the SQL
Editor and run blocks A1, A2, B1, B3 from `docs/authorization-proof.md`. The
role → user-ID map is at the top of that file.

---

## Advisor notes (reviewed exceptions)

- **`security_definer_view` (ERROR) on `suppliers_pc`** — intentional and required. It is the
  mechanism that hides restricted columns from production control at the database. All
  logged-in users share the single Postgres `authenticated` role, so per-role column GRANTs
  are impossible; the definer view exposing only safe columns is the correct control (and is
  what the spec's Section 6 mandates). Accepted.
- SECURITY DEFINER function EXECUTE warnings were mitigated by revoking EXECUTE from
  `anon`/`authenticated`/`public` on all trigger functions.

---

## Notes for future sessions

- The digest scheduled function uses the service role key and reads `change_log` across all
  users — it bypasses RLS, so it must filter digest content by recipient role and must never
  send to production control.
- Migrations applied so far: `profiles_roles_and_helpers`, `suppliers_table_rls_and_pc_view`,
  `change_log_table_trigger_and_rls`, `harden_function_exposure`.
- Tables are empty (0 rows). Seed `suppliers` from `docs/suppliers-seed.csv` in a later step;
  do not seed `overall_score` (generated) or `change_log`.

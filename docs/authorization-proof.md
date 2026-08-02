# Authorization Proof — Supplier ESG Register

> A set of copy-paste SQL queries that demonstrate the role-based authorization
> **at the database level** by impersonating each role and showing what the
> database returns. Use these live in a demo to prove the access control is real
> — enforced by Postgres, not hidden in the React interface.
>
> **Every query runs inside `begin … rollback`, so nothing is ever changed.**
> The write tests attempt an edit and are rolled back; the database either
> refuses them outright or the change is discarded. Safe to run against the live
> project any number of times.

**Last updated:** 2 August 2026 — Session 2
**Project:** `esg-resource-pilot` (ref `hulgunguwjhxsgdhinrm`)

---

## How to run this

1. Open the Supabase dashboard for the project:
   **https://supabase.com/dashboard/project/hulgunguwjhxsgdhinrm**
   (If the Free-plan project is paused, open it and let it resume first.)
2. In the left sidebar click **SQL Editor**, then **+ New query**.
3. Copy **one numbered block below** into the editor and click **Run**
   (or press Cmd/Ctrl + Enter). Run them one block at a time — each block is a
   self-contained transaction.
4. Compare the output to the **Expected** note under each block.

### How the impersonation works

Normally the app knows who you are from your login (a JWT). In the SQL Editor
you are a superuser, so each block *pretends to be* a specific user for the
duration of one transaction:

```sql
set local role authenticated;                       -- act as a logged-in user, not a superuser
set local request.jwt.claims to '{"sub":"<USER-ID>","role":"authenticated"}';  -- say WHICH user
```

Row-Level Security then applies exactly as it would for that person in the app.
`set local` only lasts until the `rollback`, so the next block starts clean.

### The role → user-ID map

The blocks below already contain the current IDs. If users are ever recreated,
refresh them by running this first and pasting the new IDs in:

```sql
select role, id, email from public.profiles order by role;
```

| Role | Demo account | User ID (`sub`) |
|------|--------------|-----------------|
| admin | `lcaresource.pilot@gmail.com` | `0600a541-cead-41a5-8c62-2248123c0961` |
| purchasing | `lcaresource.pilot+purchasing@gmail.com` | `4ea24007-cbb9-4928-ba12-c837ce883196` |
| sustainability | `lcaresource.pilot+sustainability@gmail.com` | `cc82ebdd-221e-477a-8676-6c4796ac4f28` |
| production_control | `lcaresource.pilot+production@gmail.com` | `075177da-4a37-44d7-8b8a-4bb7d54add6a` |

---

## Part A — Read access: what each role can even see

### A1 · Production Control sees NO base supplier rows, only the restricted view

```sql
begin;
set local role authenticated;
set local request.jwt.claims to '{"sub":"075177da-4a37-44d7-8b8a-4bb7d54add6a","role":"authenticated"}';
select
  current_user_role()                        as acting_as,
  (select count(*) from public.suppliers)    as rows_on_base_suppliers_table,
  (select count(*) from public.suppliers_pc) as rows_on_permitted_view,
  (select count(*) from public.profiles)     as profile_rows_visible;
rollback;
```

**Expected:** `production_control · 0 · 14 · 1`
Production Control gets **0 rows** from the base `suppliers` table (it has no
read policy there) and reads suppliers only through `suppliers_pc`. It sees just
its own profile row.

### A2 · The columns Production Control actually receives

```sql
begin;
set local role authenticated;
set local request.jwt.claims to '{"sub":"075177da-4a37-44d7-8b8a-4bb7d54add6a","role":"authenticated"}';
select string_agg(column_name, ', ' order by ordinal_position) as columns_in_pc_payload
from information_schema.columns
where table_schema = 'public' and table_name = 'suppliers_pc';
rollback;
```

**Expected:**
`id, supplier_name, country, category, esg_report_url, score_e, score_s, score_g, overall_score, updated_at`
No `score_justification`, `internal_notes`, `contract_status`,
`contract_renewal_date` or `annual_spend`. The restricted fields are **absent
from the payload**, not blanked — a Production Control user inspecting network
traffic finds nothing commercial or deliberative.

### A3 · Admin sees everything

```sql
begin;
set local role authenticated;
set local request.jwt.claims to '{"sub":"0600a541-cead-41a5-8c62-2248123c0961","role":"authenticated"}';
select
  current_user_role()                     as acting_as,
  (select count(*) from public.suppliers) as rows_on_base_suppliers_table,
  (select count(*) from public.profiles)  as profile_rows_visible,
  (select count(*) from public.suppliers where internal_notes is not null)
                                          as suppliers_with_visible_internal_notes;
rollback;
```

**Expected:** `admin · 14 · 5 · 14` — full read of every supplier row, every
column, and all five profiles.

### A4 · A non-admin reads only its OWN profile

```sql
begin;
set local role authenticated;
set local request.jwt.claims to '{"sub":"4ea24007-cbb9-4928-ba12-c837ce883196","role":"authenticated"}';
select current_user_role() as acting_as,
       (select count(*) from public.profiles)            as profile_rows_visible,
       (select string_agg(email, ', ') from public.profiles) as profiles_it_can_see;
rollback;
```

**Expected:** `purchasing · 1 · lcaresource.pilot+purchasing@gmail.com`.
Swap the `sub` for the sustainability or production_control ID and you get the
same result — one row, their own.

---

## Part B — Write access: what the database refuses

These prove the **column-level** write rules. Blocks B1–B3 are expected to
**fail with an error** — that error *is* the proof. B4 and B5 are positive
controls that succeed (then roll back), showing the rules don't block
everything.

### B1 · Purchasing CANNOT edit an ESG score → rejected

```sql
begin;
set local role authenticated;
set local request.jwt.claims to '{"sub":"4ea24007-cbb9-4928-ba12-c837ce883196","role":"authenticated"}';
update public.suppliers set score_e = 5
  where id = (select id from public.suppliers limit 1);
rollback;
```

**Expected — an error:**
`Purchasing role cannot edit ESG scores or the score justification.`

### B2 · Sustainability CANNOT edit a commercial field → rejected

```sql
begin;
set local role authenticated;
set local request.jwt.claims to '{"sub":"cc82ebdd-221e-477a-8676-6c4796ac4f28","role":"authenticated"}';
update public.suppliers
  set contract_status = case when contract_status = 'Expired' then 'Active' else 'Expired' end
  where id = (select id from public.suppliers limit 1);
rollback;
```

**Expected — an error:**
`Sustainability role cannot edit commercial fields (contract_status, contract_renewal_date, annual_spend).`
(The `case` forces a real change; the guard trigger only fires when a protected
column's value actually changes.)

### B3 · Even ADMIN cannot write the change log → rejected (append-only)

```sql
begin;
set local role authenticated;
set local request.jwt.claims to '{"sub":"0600a541-cead-41a5-8c62-2248123c0961","role":"authenticated"}';
insert into public.change_log (supplier_name_snapshot, field_name, new_value)
  values ('TAMPER TEST', 'injected_by_admin', 'should not be possible');
rollback;
```

**Expected — an error:** `permission denied for table change_log`.
The change log has no insert/update/delete path for any role, including admin —
it is written only by a database trigger. An audit trail its administrator can
rewrite is not an audit trail.

### B4 · Sustainability CAN edit a score (positive control) → succeeds, rolled back

```sql
begin;
set local role authenticated;
set local request.jwt.claims to '{"sub":"cc82ebdd-221e-477a-8676-6c4796ac4f28","role":"authenticated"}';
update public.suppliers
  set score_e = case when score_e = 5 then 4 else 5 end
  where id = (select id from public.suppliers where score_e is not null limit 1)
  returning supplier_name, score_e as new_score_e;
rollback;
```

**Expected:** one row returned (e.g. `BASF SE · 5`). The edit is allowed, then
discarded by `rollback`.

### B5 · Purchasing CAN edit a commercial field (positive control) → succeeds, rolled back

```sql
begin;
set local role authenticated;
set local request.jwt.claims to '{"sub":"4ea24007-cbb9-4928-ba12-c837ce883196","role":"authenticated"}';
update public.suppliers set contract_status = 'Under review'
  where id = (select id from public.suppliers limit 1)
  returning supplier_name, contract_status as new_contract_status;
rollback;
```

**Expected:** one row returned (e.g. `BASF SE · Under review`), then rolled back.

---

## Part C — See the rules themselves (optional)

Dump every Row-Level Security policy in plain text — the actual rules the
database enforces, no impersonation needed:

```sql
select tablename, policyname, cmd as command, roles,
       coalesce(qual, '(none)')       as using_expression,
       coalesce(with_check, '(none)') as with_check_expression
from pg_policies
where schemaname = 'public'
order by tablename, cmd, policyname;
```

Note: the **column-level** write limits (B1, B2) are enforced by the
`enforce_supplier_column_permissions` trigger, and Production Control's column
hiding (A1, A2) by the `suppliers_pc` view — neither appears in `pg_policies`.
Together, the RLS policies + that trigger + that view are the full authorization
model. See `docs/supabase-setup.md` for all three.

---

## One-line summary for the demo

> "Watching the database refuse the query is the proof. Production Control asks
> for supplier data and gets 0 rows and 10 columns; Purchasing tries to change a
> score and Postgres rejects it; even the admin cannot rewrite the audit log.
> None of this depends on the front end — it's the database saying no."

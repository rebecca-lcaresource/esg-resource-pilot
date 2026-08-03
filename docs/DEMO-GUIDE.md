# Supplier ESG Register — Demo Guide & Accomplishments

**Live app:** https://supplier-esg-register.netlify.app
**Built:** 31 July 2026
**Updated:** 2 August 2026 — added the in-app Demo guide sidebar and runnable database-proof queries
**Built by:** Rebecca LeBlanc (LCA Resource LLC)

---

## What this is

An internal **Supplier ESG Register** — a web application where a chemical
manufacturer scores suppliers on Environmental, Social and Governance
performance, and where **four different roles hold different rights to read and
edit the same records.**

The supplier scoring is the vehicle. The real deliverable is a demonstration
that **meaningful access control can be enforced at the database level** in a
sustainability reporting tool — not just hidden in the interface.

---

## What was accomplished

A complete, deployed, full-stack application built from an empty repository:

- **Database (Supabase / PostgreSQL):** three tables — suppliers, user profiles,
  and an append-only change log — with row-level security enabled on all of them.
- **Role-based authorization** for four roles: Admin, Purchasing, Sustainability,
  Production Control — each with different read and edit rights over the same data.
- **Passwordless, invite-only login** via an emailed one-time code (no passwords,
  no clickable links), delivered through Brevo on an authenticated domain.
- **A React + Vite + Tailwind front end:** sign-in, the supplier register
  (sortable, filterable, CSV export), a role-aware supplier detail view, admin
  user management, and an archive with permanent-delete protection.
- **A tamper-proof audit trail:** every field change is logged automatically, and
  the log cannot be edited or deleted by anyone — not even an administrator.
- **Deployed to the public web** on Netlify, connected to GitHub.

---

## The core demonstration — "two people see different things"

This is the heart of the demo. Open the **same supplier** as two different roles
and show that the difference is real, not cosmetic:

| Field | Admin / Purchasing / Sustainability | Production Control |
|---|---|---|
| Supplier name, country, category | ✅ sees | ✅ sees |
| E / S / G scores, overall score | ✅ sees | ✅ sees |
| Score justification | ✅ sees | ❌ **absent** |
| Internal notes | ✅ sees | ❌ **absent** |
| Contract status, renewal date, annual spend | ✅ sees | ❌ **absent** |

**The key point for your instructor:** for Production Control, the hidden fields
are not blanked out or greyed — they are **completely absent from the data the
browser receives.** Even inspecting the network traffic reveals no commercial or
deliberative information. This is enforced by the database (a restricted view plus
row-level security), so it cannot be bypassed from the front end.

---

## Suggested demo script (~10 minutes)

> Login note: every login sends an 8-digit code by email. For the pilot, the four
> role accounts all deliver to **lcaresource.pilot@gmail.com** (check the
> **Promotions** tab). `rebecca@lcaresource.com` is a second admin whose codes go
> to the main inbox.
>
> Follow-along tip: the app has a built-in **Demo guide** — a navy tab on the
> right edge of every screen (including sign-in). Click it to open a panel that
> lists these steps and lets you check each one off as you present.

**1. Sign in as Admin** (`lcaresource.pilot@gmail.com`)
- Show the full register: 14 suppliers, sortable/filterable, overall scores.
- Point out unscored suppliers (Kessler, Vasco) show an em dash "—", not a fake
  average, and sort to the bottom.
- Open a supplier — every field is visible and editable.

**2. Sign in as Production Control** (`lcaresource.pilot+production@gmail.com`)
- Same suppliers, same scores — but open a supplier and show the commercial and
  internal fields are **gone entirely**. Read-only; no add/edit/archive buttons.
- (Optional, for a technical audience) open the browser's Network tab and show the
  response payload contains none of the restricted fields.

**3. Sign in as Sustainability** (`lcaresource.pilot+sustainability@gmail.com`)
- Can edit the E/S/G scores and justification, but the commercial fields are
  read-only, labelled "editable by purchasing."
- Edit a score and save — then scroll to the **change history** and show the edit
  was logged automatically with who and when.

**4. Sign in as Purchasing** (`lcaresource.pilot+purchasing@gmail.com`)
- The mirror image: can edit contract status / renewal / spend, but the scores are
  read-only, labelled "editable by sustainability."

**5. Export CSV as two different roles**
- Admin's CSV contains every column; Production Control's CSV **lacks the
  restricted columns entirely** — same permission model as the screen.

**6. Admin-only power (back as Admin)**
- Show User Management (assign roles) and the Archive (restore / permanent delete
  behind a type-the-name confirmation).
- Emphasise: the change log is append-only — even the admin cannot rewrite history.

---

## The technical proof (for a technical instructor)

The security-critical rules were verified directly against the database by
simulating each role, not just by clicking the UI. Confirmed:

- Sustainability **cannot** edit commercial fields — rejected by the database.
- Purchasing **cannot** edit scores — rejected by the database.
- Production Control sees **0 rows** querying the suppliers table directly (it can
  only reach a restricted view) and **cannot** insert/update/delete.
- The change log **cannot** be altered or deleted by any role, including admin.
- Permanent delete is admin-only and only on already-archived rows; the deleted
  supplier's change-log history is retained.
- Each non-admin user can read **only their own** profile row.

**Run it live (optional, but the strongest moment for a technical audience).**
These checks are fully reproducible in the Supabase **SQL Editor** — the exact
copy-paste queries are in `docs/authorization-proof.md`. Run blocks **A1 → A2 →
B1 → B3** in order and narrate each as the result appears:

- **A1** — "it can't see the data" (Production Control → **0 rows** from `suppliers`)
- **A2** — "the columns aren't even there" (its payload has 10 safe columns, no commercial/internal fields)
- **B1** — "it can't edit a score" (Purchasing edit **rejected** by the database)
- **B3** — "not even the admin can rewrite the log" (change-log insert **rejected**)

Every block runs inside `begin … rollback`, so running it changes nothing. See
`docs/supabase-setup.md` for the same sequence with the "why this order" notes.

---

## Architecture at a glance

- **Front end:** React + Vite + Tailwind CSS, hosted on Netlify.
- **Back end:** Supabase (PostgreSQL, Auth, Row-Level Security).
- **Email:** Brevo SMTP on the authenticated `lcaresource.com` domain.
- **Auth:** email one-time code, invite-only, roles stored per user.
- **How permissions are enforced:** row-level security policies + a column-limited
  database view for Production Control + a trigger that blocks out-of-role edits.
  The interface reflects permissions for convenience, but the **database is the
  enforcement** — that is the whole point of the build.

---

*This app is a pilot demonstration. The supplier names and their published ESG
reports are real; the scores, notes and commercial figures are invented so the
tool can be shown to anyone without disclosing confidential information.*

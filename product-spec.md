# Product Spec — Supplier ESG Register

**Version:** 1.0
**Date:** 29 July 2026
**Author:** Rebecca LeBlanc
**Status:** Confirmed

---

## Section 1 — Tool Summary

**Tool name:** Supplier ESG Register

**What it does:** Maintains an internal register of suppliers scored on Environmental, Social and Governance performance, where four different roles hold different rights to read and edit the same supplier records, enforced at the database rather than in the interface.

**Who uses it:** Four internal roles at a chemical manufacturer — purchasing, sustainability, production control, and a system administrator. Access is invite-only; there is no public side and no self-registration.

**Why it exists:** The primary purpose of this build is to demonstrate that meaningful access control can be built into a sustainability reporting application — that purchasing and sustainability can own different parts of the same record, that production control can consume rankings without seeing commercial detail or internal deliberation, and that every change is attributable. Supplier ESG ranking is the vehicle; provable authorization is the deliverable. The tool is intended as a pilot demonstration first, with the option to harden it into real departmental use afterwards.

**Build status:** First build — no prior version.

---

## Section 2 — Classification

### Data Model

**Decision:** D3

| Label | What it means | This tool? |
|-------|--------------|-----------|
| D1 — Hardcoded | All data is written into the code by the developer. Users cannot input anything that persists. | No |
| D2 — Session | Data enters the tool during use and disappears when the tab closes. No database. | No |
| D3 — Persisted | Data is written to a database and survives after the session ends. Supabase is required. | Yes |

**Reason:** Scores entered by one department must be visible to others indefinitely, and every change must be recorded in an audit trail that outlives the session.

**D3 is triggered — the following apply:**
- [x] Data must be retrievable after the session ends
- [x] Multiple sessions contribute to the same dataset
- [x] An audit trail or history is needed
- [x] Data submitted by one person must be visible to another
- [ ] Results must be accessible via a URL after the session ends
- [ ] Files uploaded by users must be stored and retrievable later

---

### Access Model

**Decision:** A3

| Label | What it means | This tool? |
|-------|--------------|-----------|
| A1 — Public | Anyone with the URL can use it. No login. | No |
| A2 — Authentication | Users must log in. All logged-in users have the same permissions. | No |
| A3 — Authorization | Users must log in and have different roles with different permissions. | Yes |

**Reason:** Purchasing, sustainability and production control must each have different read and write rights over the same supplier records — this differentiation is the entire point of the tool.

---

### If Access Model is A3 — define all roles

| Role name | Who this is | What they can see | What they can do |
|-----------|------------|-------------------|-----------------|
| Admin | System administrator running the pilot | Every field on every record, plus the user list and all change history | Everything: edit any field, add and archive suppliers, permanently delete archived suppliers, invite users, assign and change roles |
| Sustainability | Sustainability team members responsible for supplier ESG assessment | Every field on every supplier record, including commercial fields, plus full change history | Add suppliers, archive suppliers, edit the E, S and G scores, edit the score justification, edit internal notes. Cannot edit commercial fields. Cannot permanently delete |
| Purchasing | Purchasing team members managing supplier contracts | Every field on every supplier record, including scores and justifications, plus full change history | Add suppliers, archive suppliers, edit contract status, renewal date and annual spend, edit internal notes. Cannot edit scores or justifications. Cannot permanently delete |
| Production Control | Operational planners who need supplier sustainability standing but no commercial or deliberative detail | Supplier name, country, category, ESG report link, E, S and G scores, overall score, last updated. **Cannot see** the score justification, internal notes, contract status, renewal date or annual spend. Change history filtered to entries for fields they are permitted to see | Read only. No adding, editing, archiving or deleting |

---

### Tier

**Tier:** 3

D3 + A3 — persisted data with role-differentiated authorization. Netlify + Supabase with auth and row-level security.

---

### Standalone or Stack

**This tool is:** Standalone — it does not share a database with any other tool.

---

## Section 3 — Arms

### AI API Arm

**Active:** No

Deferred to phase 2. See Section 12.

---

### Export Arm

**Active:** Yes

| Detail | Answer |
|--------|--------|
| Format | CSV |
| What is exported | The supplier register as the requesting user is permitted to see it. **Critical:** the export must be generated from the same permission-filtered source as the on-screen table. A production control user's CSV must not contain the justification, internal notes, contract status, renewal date or annual spend columns — not blanked, not empty, absent. An export that bypasses the permission model makes every other rule in this spec decorative |
| PDF design intent | N/A — PDF deferred to phase 2 |

---

### Email Arm

**Active:** Yes

**Note — provider deviation from framework default:** this tool uses **Brevo**, not Resend. Resend requires an MX record on `send.<domain>` to establish a bounce return path, and the builder's DNS is managed by Wix, which cannot publish MX records on subdomains. Brevo authenticates with TXT and DKIM records only and therefore works within this constraint. Claude Code must not substitute Resend.

There are two distinct email flows:

**Flow 1 — Login codes**

| Detail | Answer |
|--------|--------|
| Trigger event | A user requests a login code from the sign-in screen |
| Recipient | The user requesting access |
| Email content | A six-digit one-time code and its expiry time. No branding, no marketing content, no links |
| File attachment in transit | No |
| Function placement | None — handled natively by Supabase Auth using the custom SMTP configuration. No function required |

**Flow 2 — Daily change digest**

| Detail | Answer |
|--------|--------|
| Trigger event | A scheduled job, once per day. Not triggered by any user action |
| Recipient | All users holding the admin, purchasing or sustainability role. **Production control is deliberately excluded** — a digest sent to production control would carry field changes they are not permitted to see, turning the notification into a bypass of the permission model. If a recipient is ever added, the digest content must be filtered by that recipient's role in the same way the on-screen change log is |
| Email content | A list of the previous 24 hours' changes: supplier name, field changed, old value, new value, who changed it, timestamp. Plain text or simple HTML |
| File attachment in transit | No |
| Function placement | Netlify scheduled function |

> **Key storage:** the Brevo SMTP credentials used by the Netlify scheduled function are stored as **Netlify environment variables**. The same credentials are entered separately into the Supabase dashboard's Auth SMTP settings for login codes — that is dashboard configuration, not a file, and must never be written into the repo.

---

### Scheduled Automation Arm

**Active:** Yes

| Detail | Answer |
|--------|--------|
| Schedule | Once daily at 07:00 in the builder's local timezone (US Eastern) |
| What happens automatically | Reads the change log for the previous 24 hours, composes a single digest message, and sends it to admin, purchasing and sustainability users. **If there were no changes in the period, no email is sent at all** — an empty daily digest trains recipients to filter the message |
| Triggers an email | Yes |
| Triggers a database update | No |

---

## Section 4 — Stack and Deployment

### All Tiers

| Detail | Answer |
|--------|--------|
| Frontend framework | React + Vite + Tailwind |
| Deployment target | Netlify |
| Netlify MCP | Not active — deployment will be done manually through the Netlify dashboard, and environment variables added manually after the first deploy |

**GitHub — pre-build requirement:** Rebecca creates the GitHub repo before the first Claude Code session and uploads `product-spec.md`, `CLAUDE.md` and `PROGRESS.md` to the repo root. Claude Code assumes the repo exists, commits regularly and pushes to main. It does not create or configure the repo.

---

### Supabase project

**Supabase project status:** New — Claude Code will create it at the start of the build session.

**Supabase plan:** Free — pauses after roughly one week of no traffic. The builder is aware and will open the tool the day before any demonstration to ensure the project is awake.

**If new:**

| Detail | Answer |
|--------|--------|
| Proposed project name | `esg-resource-pilot` |
| Confirmed project name | `esg-resource-pilot` — confirmed by the builder |

> Claude Code will pause at the start of the session, confirm the project name, and create the Supabase project via MCP before building anything.

**supabase-setup.md:** created by Claude Code at the end of the first build session and updated whenever the database changes. Lives permanently in `docs/`.

---

## Section 5 — Data Architecture

**What data is collected or stored in this tool:**

| Field name | Plain language label | Data type | Who provides it | Required? |
|-----------|---------------------|-----------|----------------|-----------|
| supplier_name | Supplier name | Text | Purchasing or sustainability | Yes |
| country | Country | Text | Purchasing or sustainability | Yes |
| category | Supply category | Text | Purchasing or sustainability | Yes |
| esg_report_url | Link to published ESG report | Text (URL) | Purchasing or sustainability | No |
| score_e | Environmental score | Integer 1–5 | Sustainability | No |
| score_s | Social score | Integer 1–5 | Sustainability | No |
| score_g | Governance score | Integer 1–5 | Sustainability | No |
| overall_score | Overall score | Decimal, one place | Calculated — never entered | No |
| score_justification | Justification for the scores | Long text | Sustainability | No |
| internal_notes | Internal notes | Long text | Purchasing or sustainability | No |
| contract_status | Contract status | Text | Purchasing | No |
| contract_renewal_date | Contract renewal date | Date | Purchasing | No |
| annual_spend | Annual spend | Numeric | Purchasing | No |
| is_archived | Archived | Boolean, default false | Purchasing, sustainability or admin | Yes |
| created_at | Created | Timestamp | Automatic | Yes |
| updated_at | Last updated | Timestamp | Automatic | Yes |
| full_name | User's name | Text | Admin | Yes |
| email | User's email | Text | Admin (via Supabase Auth invite) | Yes |
| role | User's role | Enum: admin, purchasing, sustainability, production_control | Admin | Yes |

**Tables needed:**

| Table name | What it stores | Key fields |
|-----------|---------------|-----------|
| suppliers | One row per supplier | supplier_name, country, category, esg_report_url, score_e, score_s, score_g, score_justification, internal_notes, contract_status, contract_renewal_date, annual_spend, is_archived, created_at, updated_at |
| profiles | One row per user, linked to Supabase Auth | id (references auth.users), full_name, email, role |
| change_log | One row per field change. Append-only | supplier_id, supplier_name_snapshot, field_name, old_value, new_value, changed_by, changed_at |

**Notes on `change_log`:**
- Written by a database trigger on `suppliers`, never by the frontend. Users cannot create, edit or delete entries by any route.
- `supplier_name_snapshot` denormalises the supplier name into each row so history remains readable after a supplier is permanently deleted. Log rows are retained on permanent delete, not cascaded away.
- One row per changed field, not per save. Editing two fields in one save produces two rows.

**File storage:** No. The ESG report is stored as a link to the supplier's own published document, not as an uploaded file.

**Derived or calculated data:** Yes — `overall_score`, calculated from the three pillar scores. See Section 9.

---

## Section 6 — Access and Permissions

**Auth configuration:**

| Detail | Answer |
|--------|--------|
| Authentication method | **Email one-time code (six-digit), not a clickable magic link.** Derived and confirmed: this is an invite-only internal tool, so passwordless is right — nobody forgets a password they never had. The code form rather than the link form is deliberate: enterprise mail security scanners open links in incoming mail before the recipient does, and magic links are single-use, so a scanner consumes the link and the colleague clicks a dead one. A six-digit code has nothing for a scanner to consume. Implemented by modifying the Supabase magic-link email template to emit `{{ .Token }}` instead of the confirmation URL, with a code entry field in the UI |
| Signup model | Invite-only — Rebecca invites specific users via the Supabase dashboard. Self-registration must be disabled |

> **Privacy note:** User accounts store email addresses. For internal and client tools this falls under the organization's existing privacy framework rather than a consent flow.

### Column-level restriction — read this before building RLS

Row-level security alone is not sufficient for this tool. Production control must be denied specific **columns**, not specific rows — they see every supplier, but not every field. Claude Code must implement this so that restricted values never leave the database:

- Expose production control's reads through a database view containing only permitted columns, and/or apply column-level `GRANT`s on `suppliers`.
- Hiding fields in the React component is **not acceptable** and must not be the only control. A production control user inspecting network traffic must not find the justification, internal notes, contract status, renewal date or annual spend anywhere in the response payload.
- The CSV export and the change log must read from the same permission-filtered source, not from the unrestricted table.

**RLS rules — who can read and write what:**

**Table: `suppliers`**

| User type | Can read | Can insert | Can update | Can delete |
|----------|----------|------------|------------|------------|
| Unauthenticated (anon) | No | No | No | No |
| Admin | All rows, all columns | Yes | Yes — any column | Yes — permanent delete, archived rows only |
| Sustainability | All rows, all columns | Yes | Yes — `score_e`, `score_s`, `score_g`, `score_justification`, `internal_notes`, `is_archived` only | No |
| Purchasing | All rows, all columns | Yes | Yes — `contract_status`, `contract_renewal_date`, `annual_spend`, `internal_notes`, `is_archived` only | No |
| Production Control | All rows, restricted columns only: `supplier_name`, `country`, `category`, `esg_report_url`, `score_e`, `score_s`, `score_g`, `overall_score`, `updated_at` | No | No | No |

Editable identity fields (`supplier_name`, `country`, `category`, `esg_report_url`) may be updated by admin, purchasing and sustainability.

**Table: `change_log`**

| User type | Can read | Can insert | Can update | Can delete |
|----------|----------|------------|------------|------------|
| Unauthenticated (anon) | No | No | No | No |
| Admin | All rows | No — trigger only | **No** | **No** |
| Sustainability | All rows | No — trigger only | No | No |
| Purchasing | All rows | No — trigger only | No | No |
| Production Control | Only rows where `field_name` is one of the columns they are permitted to read | No | No | No |

> **Deliberate deviation:** admin has full rights everywhere else but cannot alter or delete change log entries. An audit trail that its administrator can quietly rewrite is not an audit trail, and in a tool built to demonstrate accountability this restriction is the point. Flagged in Section 15 for the builder to overturn if she disagrees.

**Table: `profiles`**

| User type | Can read | Can insert | Can update | Can delete |
|----------|----------|------------|------------|------------|
| Unauthenticated (anon) | No | No | No | No |
| Admin | All rows | Yes | Yes | Yes |
| Sustainability | Own row only | No | No | No |
| Purchasing | Own row only | No | No | No |
| Production Control | Own row only | No | No | No |

A user's own role must not be editable by that user under any circumstances, including admin self-demotion protection where practical.

---

## Section 7 — GDPR

**GDPR outcome:** **Not applicable** — confirmed during the interview. This tool collects no personal data through its forms or uploads. Supplier records hold company-level information only, with no named contact persons. The only personal data in the system is the work email addresses of four internal colleagues, stored by Supabase Auth for invite-only login, which falls under the organisation's existing privacy framework per the Section 6 privacy note.

> If a future version adds supplier contact names or email addresses, this section must be reopened — a consent checkpoint, data statement and deletion mechanism become mandatory at that point.

---

## Section 8 — Screen and UI Structure

### Sign-in

- **Purpose:** Let an invited colleague authenticate without a password.
- **What is visible:** Tool name, a single work-email field, a submit button. After submission, a six-digit code entry field with a resend option.
- **User actions:** Enter email, receive code, enter code.
- **What happens next:** On success, the user lands on the Supplier List with their role already resolved. On failure or an uninvited address, a neutral message that does not reveal whether the address exists in the system.

### Supplier List

- **Purpose:** The main working view — the register itself.
- **What is visible:** A table of active suppliers with columns for supplier name, country, category, E, S, G, overall score and last updated. Sort controls on every column and filters on country and category. A visible indicator of the signed-in user's role — this matters for the demonstration, since the point is that two people see different things. An "Export CSV" button. An "Add supplier" button for admin, purchasing and sustainability only.
- **User actions:** Sort, filter, export, open a supplier, add a supplier if permitted.
- **What happens next:** Clicking a row opens Supplier Detail.

### Supplier Detail

- **Purpose:** Read and edit one supplier according to the viewer's role.
- **What is visible:** All fields the role is permitted to read. Fields the role may edit are live inputs; fields it may read but not edit are rendered as plain read-only text with a visible reason ("editable by sustainability"). Fields the role may not read are absent entirely — no greyed placeholder, no empty label. Beneath the record, that supplier's change history, filtered to permitted fields. An "Archive" button for admin, purchasing and sustainability.
- **User actions:** Edit permitted fields and save; archive the supplier; follow the ESG report link.
- **What happens next:** A save writes the record and appends one change log row per changed field. Archiving removes the supplier from the Supplier List and moves it to the Archive view.

### User Management — admin only

- **Purpose:** Manage who has access and at what level.
- **What is visible:** A list of users with name, email and role. An invite control and a role selector per user.
- **User actions:** Invite a new user by email, change a user's role, remove a user's access.
- **What happens next:** Invited users receive a Supabase Auth invitation and appear in the list once they first sign in. Role changes take effect on the user's next request.
- **Access control:** Any non-admin reaching this route must be refused by the database, not merely redirected by the router.

### Archive — admin only

- **Purpose:** Hold archived suppliers and provide the only route to permanent deletion.
- **What is visible:** Archived suppliers with the date archived and who archived them. Restore and Delete permanently buttons.
- **User actions:** Restore a supplier to the active register, or permanently delete it behind a confirmation step that names the supplier.
- **What happens next:** Restore returns the supplier to the Supplier List. Permanent deletion removes the supplier row but **retains its change log entries**.

---

## Section 9 — Logic and Calculations

**What is calculated or scored:** The overall supplier ESG score.

**Inputs:** `score_e`, `score_s`, `score_g` — each an integer from 1 to 5 inclusive, entered by sustainability.

**Formula or rules:**
```
overall_score = (score_e + score_s + score_g) / 3
```
Rounded to one decimal place. All three pillars are weighted equally — weighted scoring is explicitly deferred, see Section 12. The value is derived, never entered, and never editable by any role.

**Output:** A decimal from 1.0 to 5.0.

**Edge cases:**
- If any one of the three pillar scores is missing, `overall_score` is null and displays as an em dash, not as an average of the available pillars. A partial average silently misrepresents an unassessed supplier as a scored one.
- Scores outside 1–5 or non-integer must be rejected at both the form and the database constraint level.
- A newly added supplier with no scores appears in the register with blank score columns; this is a valid state, not an error.
- Sorting by overall score must place unscored suppliers last regardless of sort direction rather than treating null as zero.

---

## Section 10 — Brand and Visual Direction

**Brand reference:** No brand file — clean neutral default, described below.

- **Primary colour:** Deep slate blue, approximately `#1E3A5F`
- **Secondary colour:** Muted teal for positive states, approximately `#2E7D7B`; restrained amber `#B45309` and red `#991B1B` for warnings and low scores
- **Font:** Inter, or the nearest available system sans-serif
- **Logo:** Not available — a plain wordmark of the tool name is sufficient

**Visual feel:** Professional and corporate. Dense enough to read as a working internal system rather than a marketing page. Generous table spacing, clear typographic hierarchy, no decorative illustration, no gradients. Score values may use restrained colour coding — low scores should be legible as low without shouting.

**Reference or inspiration:** The visual priority is that role differences are immediately obvious to an audience watching a demonstration. A persistent, clearly visible indication of who is signed in and what role they hold is a functional requirement, not decoration.

---

## Section 11 — API and Credentials

| Service | What it does in this tool | Key required | Where key is stored |
|---------|--------------------------|-------------|-------------------|
| Supabase | Database, Auth, row-level security | Anon key (public, browser-safe) + service role key (server-side only) | Netlify environment variables |
| Brevo | SMTP delivery for login codes and the daily digest | SMTP login string + SMTP master password | Netlify environment variables for the scheduled digest function; entered directly into the Supabase dashboard Auth SMTP settings for login codes |

> **Security rule — no exceptions:** No API key, token, password or credential may appear in any HTML file, any JavaScript file, or any file committed to GitHub. Claude Code must enforce this regardless of tier or context.

**Credentials readiness:**

| Credential | Status | Where to get it |
|-----------|--------|----------------|
| Supabase anon key | Created by Claude Code with the project | Supabase dashboard → Project Settings → API |
| Supabase service role key | Created by Claude Code with the project | Supabase dashboard → Project Settings → API |
| Brevo SMTP login + master password | **Needs creating — pre-build task** | Brevo dashboard → SMTP & API → SMTP tab. Note: the SMTP key is a different credential from the API key; the API key will not authenticate an SMTP connection |

---

## Section 12 — Out of Scope — Phase 2

| Deferred feature | Reason it is deferred |
|-----------------|----------------------|
| PDF export | Requires a defined layout and design intent before build, and demonstrates nothing about authorization that the permission-filtered CSV does not already prove |
| AI drafting or summarising of published ESG reports | Needs an API key and carries a per-run cost; adds nothing to the security demonstration. A natural phase 2 feature as "AI drafts, sustainability approves" |
| Weighted E/S/G scoring | Would require a weights table, an interface to manage it, and a further permission decision about who may change weights. Simple average is sufficient to validate the core tool |
| Plant or site based row filtering for production control | Arguably the stronger row-level security demonstration, but requires a site assigned to every user and every supplier, more schema and more seed data, and would leave production control's screen mostly empty during the pilot. Hardening phase |
| Real internal commercial data | The pilot deliberately runs invented scores, notes and commercial figures against real company names and their genuinely published ESG reports, so the tool can be shown to anyone without disclosing commercial information |
| Immediate per-change notification | Replaced by the daily digest to keep volume inside the free email tier and to keep the notification readable |

---

## Section 13 — Acceptance Criteria

| # | What to verify | Expected result | Done? |
|---|---------------|-----------------|-------|
| 1 | Sign-in delivers a six-digit code, not a clickable link | Email arrives via Brevo containing a numeric code; entering it authenticates the user | [ ] |
| 2 | An email address not invited cannot obtain access | Request is refused with a message that does not disclose whether the address is registered | [ ] |
| 3 | Supplier List renders for every role | Table loads with all specified columns; signed-in user's role is visibly displayed | [ ] |
| 4 | Overall score calculates correctly | E=4, S=3, G=5 yields 4.0; no role can edit the overall score field | [ ] |
| 5 | Partial scoring does not produce a misleading average | Supplier with two of three pillars scored shows an em dash, not an average | [ ] |
| 6 | Sustainability cannot edit commercial fields | Direct database update of `annual_spend` as a sustainability user is rejected by RLS, not merely hidden in the UI | [ ] |
| 7 | Purchasing cannot edit scores | Direct database update of `score_e` as a purchasing user is rejected by RLS | [ ] |
| 8 | Production control cannot see restricted columns **in the payload** | Inspecting the network response as a production control user reveals no justification, internal notes, contract status, renewal date or annual spend anywhere | [ ] |
| 9 | Production control cannot write | Any insert, update or archive attempt is rejected by the database | [ ] |
| 10 | CSV export respects the exporting user's permissions | Production control's CSV lacks the restricted columns entirely — absent, not blank | [ ] |
| 11 | Change log captures every edit | One row per changed field, with correct old value, new value, user and timestamp | [ ] |
| 12 | Change log is filtered by role | Production control sees only entries for fields they may read; no entry reveals a restricted field name or value | [ ] |
| 13 | Change log cannot be altered | Update and delete attempts on `change_log` fail for every role, including admin | [ ] |
| 14 | Archive removes from register without losing data | Archived supplier disappears from Supplier List, appears in Archive, record and history intact | [ ] |
| 15 | Only admin can permanently delete | Delete control is unavailable to other roles and refused at the database. After deletion, the supplier's change log rows remain and remain readable | [ ] |
| 16 | User Management is admin-only at the database level | A non-admin requesting profile data for other users is refused by RLS, not just redirected | [ ] |
| 17 | Daily digest sends correctly | On a day with changes, admin, purchasing and sustainability receive one digest listing them; production control receives nothing | [ ] |
| 18 | Digest suppresses empty days | On a day with no changes, no email is sent at all | [ ] |
| 19 | Tool deploys and is reachable | Live Netlify URL loads correctly on desktop and mobile | [ ] |
| 20 | No credential appears in the repository | Search of the committed codebase finds no Supabase service role key and no Brevo credential | [ ] |

---

## Section 14 — Build Path

**This tool's tier:** Tier 3

---

### Pre-build steps — complete these before opening Claude Code

- [ ] Tool Architect skill — interview complete, this spec written and confirmed by the builder
- [ ] Brevo account created and sending domain authenticated (detailed steps below)
- [ ] Brevo SMTP login and master password collected and stored in a password manager
- [ ] Seed data pack prepared (suppliers with published ESG reports, user list, role assignments)
- [ ] Project Governor skill — CLAUDE.md and PROGRESS.md produced from this spec
- [ ] GitHub repo created by the builder
- [ ] product-spec.md uploaded to the GitHub repo root
- [ ] CLAUDE.md uploaded to the GitHub repo root
- [ ] PROGRESS.md uploaded to the GitHub repo root
- [ ] Brand skill file — N/A, no brand file for this build
- [ ] Netlify connected to the GitHub repo (Netlify MCP is not active, so this is manual)
- [ ] All credentials identified and ready to enter as environment variables — not written in any file

---

### Pre-build detail — Brevo account and domain authentication

The builder's DNS is managed by Wix, which cannot publish MX records on subdomains. Brevo is used specifically because it authenticates without an MX record. Do not substitute a provider that requires one.

**Step 1 — Brevo account**
1. Sign up at brevo.com on the free plan (300 emails per day, permanently).
2. The free plan adds "Sent with Brevo" branding to messages. Acceptable for an internal pilot.

**Step 2 — Add the sending domain**
3. Go to **Senders, Domains & Dedicated IPs** → **Domains** → **Add a domain**.
4. Enter the root domain. No subdomain prefix — the subdomain approach was abandoned because of the Wix MX limitation.
5. Brevo generates a TXT record proving domain ownership plus DKIM as either one TXT record or two CNAMEs. **Take the CNAME form if offered the choice** — it uses a 2048-bit key by default and avoids DNS character-length problems.

**Step 3 — Publish the records in Wix**
6. Wix account → **Domains** → **Domain Actions** icon → **Manage DNS Records**.
7. Confirm the domain is connected to Wix by nameservers, not by pointing. If it is pointed, these records must be added at the original registrar instead — Wix will not hold them.
8. Add each record under its matching section: TXT records under **TXT (Text)**, CNAME records under **CNAME (Aliases)**, each via **+ Add Record**.
9. **Host Name field:** Wix automatically appends the root domain. Enter only the label portion of what Brevo shows, and leave the field blank where Brevo shows `@` or the bare domain. Entering the full domain produces a doubled hostname that fails silently.
10. Click **Save**, then **Save Changes** in the confirmation popup. Records do not take effect without the second click.
11. Add no MX record.
12. If Wix rejects a long DKIM TXT value for length, use Brevo's DNS record splitter tool, which segments the value so DNS reassembles it automatically.

**Step 4 — Verify**
13. Return to Brevo and verify the domain. Allow up to 24–48 hours for propagation, though it is usually much faster.

**Step 5 — Collect SMTP credentials**
14. Top-right user menu → **SMTP & API** → the **SMTP** tab.
15. Record the SMTP login (a string of the form `7xxxxx@smtp-brevo.com`, not the account email address), the master password, the host `smtp-relay.brevo.com`, and port 587.
16. Take the **SMTP key, not the API key**. Using the API key as an SMTP password fails without a clear error.
17. Store both values in a password manager. Do not write them into this spec, the repo, or any chat.

**Step 6 — During the build, Claude Code will:**
18. Enter these values into Supabase → Authentication → SMTP Settings, with a from-address on the authenticated domain such as `no-reply@<domain>`.
19. Raise the Supabase auth email rate limit from its conservative default of 30 per hour if needed.
20. Modify the Supabase magic-link email template to emit the six-digit token rather than a confirmation URL.
21. Set the same credentials as Netlify environment variables for the scheduled digest function.

---

### Tier 3 — build session

- [ ] Open Claude Code in the project folder
- [ ] Claude Code runs First Session Setup: creates docs/, moves reference files
- [ ] Claude Code reads product-spec.md, CLAUDE.md, and PROGRESS.md
- [ ] **Supabase — new project:** Claude Code proposes `esg-resource-pilot`, waits for confirmation, then creates the project via Supabase MCP
- [ ] Claude Code builds all tables, RLS policies, the column-level restriction for production control, the change log trigger, and Auth configuration via Supabase MCP
- [ ] Claude Code creates docs/supabase-setup.md
- [ ] Claude Code builds the frontend
- [ ] Claude Code seeds the database from the seed data pack
- [ ] Test locally before deploying — including signing in as each of the four roles and verifying acceptance criteria 6 through 13, which are the security-critical ones
- [ ] Netlify MCP not active: push to main → Netlify deploys, then add environment variables manually in the Netlify dashboard
- [ ] Configure the Netlify scheduled function for the daily digest
- [ ] Optional post-build: run Supabase QA skill to verify schema, RLS and auth configuration

---

## Section 15 — Open Questions

| Question | Who answers it | Blocking? |
|----------|---------------|-----------|
| Tool name — "Supplier ESG Register" was proposed and not objected to, but never explicitly renamed | Builder | No — cosmetic, change any time before the build |
| `internal_notes` is specced as editable by both purchasing and sustainability. This was inferred, not stated — both roles can see everything, so shared ownership seemed reasonable | Builder | No — resolve during the build |
| `change_log` is specced as immutable for every role including admin, which is a deliberate tightening of "admin has full access". An audit log its administrator can rewrite is not an audit log | Builder | No — but overturning it weakens the central demonstration |
| Allowed values for `contract_status` — free text or a fixed list such as Active / In renewal / Expired / Under review | Builder | No — Claude Code may propose a list for approval |
| Supabase project name is tool-shaped rather than context-shaped, against the usual convention. Accepted knowingly; renameable later in Supabase settings | Builder — decided | No |
| Seed data pack not yet produced at the time of writing | Builder, with assistance | Yes — required before the seeding step of the build session |

---

## Section 16 — Tool Version History

| Version | Date | What changed in the tool |
|---------|------|--------------------------|
| v1.0 | 29 July 2026 | Initial build |

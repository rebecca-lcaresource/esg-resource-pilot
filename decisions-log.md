# Decisions Log — Supplier ESG Register

**Project:** Supplier ESG Register (Supabase project `esg-resource-pilot`)
**Author:** Rebecca LeBlanc
**Started:** 30 July 2026
**Purpose:** A running record of what was decided, what was rejected, and why. Written as we go, because reasoning decays faster than code. This is the raw material for the final walkthrough document.

---

## 1. What the tool is for

**Decision:** Build a supplier ESG ranking register whose real purpose is demonstrating that access control can be built into a sustainability reporting application.

**Reasoning:** The register is the vehicle, not the point. A supplier list has a natural read/write split — everyone needs to see rankings, only two departments should change them — which is precisely what row-level security exists to enforce. Small enough that the security architecture stays visible rather than buried under features.

**Sequence:** Demo first, harden into real use later. This drove the decision to run real company names with invented scores, so the tool can be shown to anyone without disclosing commercial information, and hardening becomes a data swap rather than a rebuild.

---

## 2. Email — the long detour

This consumed more of the interview than anything else and is the most instructive part of the build.

### 2.1 Why email authentication is required at all

Login codes are email. Email that isn't authenticated increasingly doesn't arrive.

Three DNS record types do the work:

- **SPF** declares which servers may send mail for your domain.
- **DKIM** cryptographically signs each message so the receiver can verify it genuinely came from you and wasn't altered.
- **DMARC** tells receivers what to do when SPF or DKIM fail.

Google, Yahoo and Microsoft tightened enforcement — unauthenticated mail is now commonly rejected outright rather than filed as spam. For a login-code system that failure mode is total: nobody can get in, and there's no error message explaining why. This is why the email work came before any code was written.

### 2.2 Provider attempt 1 — Resend. Failed.

**Chosen because:** framework default, generous free tier, good deliverability.

**Failed because:** Resend requires an **MX record** on `send.<domain>` to establish a bounce return path. Wix — which manages `lcaresource.com` DNS — **cannot publish MX records on subdomains at all**. Wix's own documentation confirms the limitation.

**Why no workaround existed:** the MX requirement is structural to how Resend receives bounces, not a setting. And Resend places its MX on `send.` even when you verify a root domain, so avoiding the subdomain didn't help. There is no configuration of Resend that works with Wix DNS.

**Cost of the error:** three or four turns. Root cause: recommending a provider without first checking the DNS provider's constraints. The general lesson — verify the constraint at the bottom of the stack before choosing the thing at the top.

### 2.3 Provider attempt 2 — Postmark. Abandoned.

**Chosen because:** authenticates with DKIM plus a Return-Path CNAME, no MX required. Wix handles TXT and CNAME on subdomains without complaint, so the blocker disappeared.

**Abandoned because:** the free developer tier is the tightest of the three, and cost was a stated constraint. Account created but never verified; nothing to unwind.

**Retained from this branch:** the "Default Transactional Stream" question surfaced a useful distinction — transactional mail (login codes, notifications) is a different category from broadcast mail (campaigns), routed differently and judged differently on reputation. Relevant regardless of provider.

### 2.4 Provider attempt 3 — Brevo. Adopted.

**Chosen because:** authenticates without MX, free tier of 300 emails/day permanently, and the volume ceiling is irrelevant at pilot scale.

**Trade-off accepted:** "Sent with Brevo" branding on the free plan. Invisible in practice on an internal login code.

**How it actually went:** Brevo required a branded subdomain in its setup flow, contradicting the advice to use the root domain — the UI was followed rather than argued with. Brevo then offered an **Automatic** DNS option, logged into Wix directly, and published five CNAME records without manual entry. This sidestepped the whole class of manual-DNS errors, including the Wix host-name trap below.

**Outcome:** `lcaresource.com` authenticated. The `email.lcaresource.com` subdomain carries only tracking links and images, so the from-address can still be on the root domain as originally intended. The subdomain Brevo insisted on cost nothing.

**Records published:** `brevo1._domainkey` and `brevo2._domainkey` (DKIM pair, CNAME form — stronger key than the single-TXT alternative and immune to DNS length limits), plus `email`, `img.email` and `r.email` for tracking. No MX. Existing `www` record pointing to Wix untouched.

### 2.5 The Wix host-name trap — avoided, but worth recording

Wix automatically appends the root domain to whatever goes in the Host Name field. A record named `send.auth.lcaresource.com` must be entered as `send.auth`. Entering the full name produces `send.auth.lcaresource.com.lcaresource.com`, which fails **silently** — no error, just a domain that never verifies. Wix also requires clicking **Save** and then **Save Changes** in a confirmation popup; missing the second click discards the record.

Not encountered, because the automatic route bypassed manual entry entirely. Recorded because it's the most common reason people conclude "Wix doesn't work with [provider]".

### 2.6 Credentials

Brevo replaced the older single "master password" with generated SMTP keys. Values: host `smtp-relay.brevo.com`, port `587`, login `b3e1ab001@smtp-brevo.com` (not the account email), password is a generated SMTP key shown once.

**"Activate for SMTP keys" deliberately left off.** It restricts sending to a fixed IP allowlist. Supabase and Netlify send from rotating cloud IPs, so enabling it would silently break login codes with no obvious cause.

**Take the SMTP key, not the API key** — adjacent on the same page, and the API key fails as an SMTP password without a clear error.

---

## 3. Authentication method

**Decision:** passwordless six-digit code, not a clickable magic link.

**Reasoning:** invite-only internal tool, so passwordless is right — nobody forgets a password they never had. But magic links are single-use, and enterprise mail security scanners open links in incoming mail *before* the recipient does. The scanner consumes the link; the colleague clicks a dead one. In a corporate IT environment this is likely, not hypothetical. A six-digit code has nothing for a scanner to consume.

**Implementation:** modify the Supabase magic-link email template to emit `{{ .Token }}` instead of the confirmation URL, and add a code entry field.

---

## 4. The permission model

### 4.1 Scoring structure

**Decision:** separate E, S and G scores on a 1–5 scale, overall = simple average, rounded to one decimal.

**Reasoning:** three score columns allow different roles to hold rights over *different columns of the same row* — a far stronger security demonstration than "these people can edit, those can't". Weighted scoring was deferred: it needs a weights table, an interface, and another permission question about who can change weights, none of which strengthens the demonstration.

### 4.2 Who edits what

**Decision:** sustainability owns the scores and justifications; purchasing owns contract status, renewal date and annual spend; both can see everything.

**Reasoning:** this is the demonstrable split. Two people side by side, same supplier row, one with editable score fields and read-only commercial fields, the other exactly reversed. That single image explains row-level security to a non-technical audience faster than any diagram.

### 4.3 Production control

**Decision:** read-only. Sees suppliers, scores, overall, report link. Cannot see justifications, internal notes, or any commercial field.

**Rejected alternative:** filtering rows by the user's plant or site. Arguably the stronger demonstration — "row-level" filtering by identity is what the term literally means — but it needs a site on every user and every supplier, more schema and more seed data, and leaves production control's screen mostly empty. Deferred to hardening.

**Critical implementation note:** this is a *column* restriction, not a row restriction. Hiding fields in the React component is not acceptable as the only control. Restricted values must never leave the database — enforced by a filtered view and/or column-level grants. A production control user inspecting network traffic must find nothing.

### 4.4 The change log

**Decision:** every field change recorded — who, what, old value, new value, when. Visible to everyone, **filtered by role**.

**The leak this closes:** an unfiltered log is a back door into every field it covers. If production control can't see justifications but can read a log entry saying "changed justification from X to Y", the restriction is decorative. The log must be filtered by the same rules as the fields.

**Decision:** the log is **append-only for every role, including admin.** No updates, no deletes, ever.

**Reasoning:** this deliberately tightens the earlier "admin has full access" answer. An audit trail its administrator can quietly rewrite is not an audit trail. In a tool built to demonstrate accountability, this restriction *is* the demonstration. Flagged in spec Section 15 as overturnable, with the consequence stated.

### 4.5 Archive versus delete

**Decision:** archive hides a supplier and preserves its record and history. Only admin can permanently delete, and permanent deletion **retains the change log rows**.

**Reasoning:** a destructive action that erases its own audit trail is an awkward thing to demo in a tool selling accountability. The `change_log` table denormalises `supplier_name` into each row so history stays readable after the parent supplier is gone.

### 4.6 Exports and notifications — the two bypass routes

**Decision:** the CSV export must be generated from the same permission-filtered source as the on-screen table. Production control's CSV lacks restricted columns entirely — absent, not blanked.

**Reasoning:** a download is the most common way a carefully built permission model gets bypassed.

**Decision:** the daily digest goes to admin, purchasing and sustainability only. Production control is excluded.

**Reasoning:** currently safe — all three recipients can see scores anyway. But a digest containing field changes is a notification-shaped bypass the moment anyone adds a restricted role to the distribution list. The rule "notification content respects the recipient's role" is written into the spec so it stays true later.

---

## 5. Notification frequency

**Decision:** one daily digest at 07:00, suppressed entirely on days with no changes.

**Reasoning:** arithmetic. One email per change to three recipients means scoring twenty suppliers in an afternoon sends sixty emails — past any free tier and straight into a muted thread. A digest sends three. Suppressing empty days matters too: a daily "nothing happened" message trains people to filter it.

**Clarification recorded because it caused confusion:** the digest is not a Brevo feature. Neither Brevo nor Postmark has one. The digest is a scheduled job **inside the tool** that composes one message and hands it to the provider. Provider choice affects deliverability, branding and allowance — never what the tool can do.

---

## 6. Deferred, and why

| Deferred | Reason |
|---|---|
| PDF export | Needs a defined layout before build; proves nothing about authorization that the filtered CSV doesn't |
| AI drafting of scores from reports | Needs an API key, costs per run, adds nothing to the security demonstration. Natural phase 2 as "AI drafts, sustainability approves" |
| Weighted E/S/G scoring | Extra table, extra interface, extra permission question |
| Plant-based row filtering | Stronger demo, more schema and seed data, empty screen for production control during pilot |
| Real commercial data | Pilot runs invented figures so it can be shown to anyone |
| Immediate per-change notification | Replaced by digest |

---

## 7. Infrastructure

**Supabase plan: Free.** Pauses after roughly a week of no traffic, and a paused project looks broken — the tool won't load until manually restored. Accepted with a mitigation: open the tool the day before any demo.

**Supabase project name: `esg-resource-pilot`.** Named after the tool rather than the organisational context, against the usual convention, which means a second tool for this context would live in a project named after the first. Accepted knowingly; renameable in Supabase settings later. The unchangeable project reference in the URL is never seen.

**Netlify MCP not active** — manual deploy and manual environment variables after the first push.

---

## 8. GDPR

**Outcome: not applicable, explicitly confirmed rather than skipped.**

Supplier records hold company-level information only, with no named contact persons. The only personal data is four internal work email addresses held by Supabase Auth for invite-only login, which falls under the organisation's existing privacy framework.

**Reopening condition:** if a future version adds supplier contact names or emails, a consent checkpoint, data statement and deletion mechanism all become mandatory.

---

## 9. Corrections made during the process

**Sector.** The spec was initially written as a pharmaceutical manufacturer. This was inferred from an unrelated skill in the workspace, never stated, and never flagged as an assumption. Corrected to **chemicals** on 30 July. Consequence was limited to one line in Section 1 plus the entire direction of the seed data pack — nothing in the security architecture depended on it. Lesson: surface inferred context as a question rather than writing it in as fact.

**Provider churn.** Three email providers evaluated before one worked. See section 2. The underlying error was choosing the top of the stack before checking the bottom.

---

## 10. Seed data — real versus invented

**Decision:** real company names with genuinely published, verified-reachable ESG reports; invented scores, justifications, notes and commercial figures.

**Decision:** every *low-scoring* supplier is a **fictional company**.

**Reasoning:** naming a real mid-size firm and displaying it with a score of 2 and "no report published" makes a public claim about that company built from invented numbers. Fictional names cost nothing and remove the problem entirely. The majors carry the credibility (working report links nobody expects to work); the fictional firms carry the low scores.

**Two rows exist purely to test null handling:** one supplier with no scores at all, and one with two of three pillars scored. Both must show an em dash, not a number. The second is the harder case — averaging two available pillars would silently claim an assessment that hasn't happened.

---

*Running document. Append at each milestone.*

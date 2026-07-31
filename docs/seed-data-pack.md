# Seed Data Pack — Supplier ESG Register

**For:** `product-spec.md` v1.0 — Supplier ESG Register
**Prepared:** 31 July 2026
**Author:** Rebecca LeBlanc

---

## What this is, and what is real in it

This pack seeds the pilot database. It follows the rule set in Section 12 of the spec: **real company names with genuinely published, currently reachable sustainability reports, and entirely invented scores, justifications, notes and commercial figures.**

Read that division carefully, because it matters when you demo:

| Element | Status |
|---|---|
| Company names, countries, categories | **Real** |
| ESG report links | **Real** — verified reachable on 31 July 2026 |
| E, S and G scores | **Invented.** Not derived from the reports, not an assessment of these companies |
| Score justifications | **Invented** |
| Internal notes | **Invented** |
| Contract status, renewal date, annual spend | **Invented.** No commercial relationship is implied |

**Say this out loud in the demo.** These are large public companies and the scores in the register are illustrative placeholders. Nobody should leave the room believing your tool has rated BASF a 4 on environment.

### Why the weak performers are fictional

You asked for a mix including suppliers with thin or absent disclosure. Every supplier in the low-scoring tier is a **fictional company**, and that was deliberate.

Naming a real mid-size firm and displaying it with a score of 2 and "no sustainability report published" makes a public claim about that company's performance — one built entirely from invented numbers, and one hard to verify even if you wanted to. Fictional names cost nothing and remove the problem. The demo lands identically.

The invented companies are marked ⚠ in the tables below and use names that don't collide with real chemical firms as far as I can tell. Worth a quick search before any external demo.

---

## The suppliers

Fourteen rows: eight real companies with strong published disclosure, six fictional with thinner or absent reporting.

### Tier A — real companies, published reports

| # | Supplier | Country | Category | E | S | G | Overall | ESG report |
|---|---|---|---|---|---|---|---|---|
| 1 | BASF SE | Germany | Base chemicals & intermediates | 4 | 4 | 5 | 4.3 | report.basf.com/2025/en/ |
| 2 | Dow Inc. | United States | Polymers | 3 | 4 | 4 | 3.7 | corporate.dow.com — INtersections Progress Report |
| 3 | Evonik Industries AG | Germany | Specialty additives | 4 | 4 | 4 | 4.0 | evonik.com/en/sustainability.html |
| 4 | Clariant AG | Switzerland | Catalysts & additives | 5 | 4 | 4 | 4.3 | clariant.com — Integrated Report 2025 |
| 5 | Croda International plc | United Kingdom | Specialty surfactants | 5 | 5 | 4 | 4.7 | croda.com — Sustainability Progress Statement 2025 |
| 6 | Covestro AG | Germany | Polyurethanes & polycarbonates | 4 | 3 | 4 | 3.7 | annualreport.covestro.com/annual-financial-report-2025/en/ |
| 7 | Solvay SA | Belgium | Soda ash & peroxides | 3 | 4 | 4 | 3.7 | solvay.com/en/sustainability |
| 8 | Eastman Chemical Company | United States | Solvents & specialty plastics | 3 | 3 | 4 | 3.3 | eastman.com — Sustainability Report 2025 |

### Tier B — fictional companies, thin or absent disclosure ⚠

| # | Supplier | Country | Category | E | S | G | Overall | ESG report |
|---|---|---|---|---|---|---|---|---|
| 9 | Meridian Solvents Ltd ⚠ | United Kingdom | Solvents | 2 | 3 | 2 | 2.3 | None — environmental policy page only |
| 10 | Halbert Industrial Gases Inc ⚠ | United States | Industrial gases | 3 | 3 | 3 | 3.0 | Partial — EHS statement, no full report |
| 11 | Tianhe Fine Chemicals Co. Ltd ⚠ | China | Fine chemical intermediates | 2 | 2 | 2 | 2.0 | None — EcoVadis bronze cited, not published |
| 12 | Northbridge Chemical Distribution ⚠ | Canada | Distribution & blending | 3 | 2 | 3 | 2.7 | Partial — parent group report only |
| 13 | Kessler Additive Werke GmbH ⚠ | Germany | Polymer additives | 3 | 3 | — | — | Partial — environmental data only, no governance disclosure |
| 14 | Vasco Polymer Compounds SA ⚠ | Spain | Polymer compounds | — | — | — | — | **None** |

### The two rows that earn their place

**Row 14, Vasco Polymer Compounds** — no report, no scores at all. This is the null test from Section 9. It must display an em dash, not 0.0, not a blank that sorts as zero, and it must sit at the bottom of the list whichever direction you sort. If it ever shows 0.0, that's a bug that would misrepresent an unassessed supplier as a failing one.

**Row 13, Kessler Additive Werke** — environmental and social scored, governance blank. This is the harder case: two of three pillars present. The spec says the overall stays null, because averaging the two available pillars would silently claim an assessment that hasn't happened. If your build shows 3.0 here, the rule wasn't implemented.

Both rows are also the honest ones. Most real registers look like this in year one.

---

## Justifications, notes and commercial fields

Sustainability owns the justification. Purchasing owns the commercial fields. Both can edit internal notes. All invented.

| # | Supplier | Score justification (sustainability) | Internal notes (shared) | Contract status | Renewal | Annual spend (USD) |
|---|---|---|---|---|---|---|
| 1 | BASF SE | Full ESRS-aligned disclosure with limited assurance. Scope 3 methodology transparent. Governance strong | Primary intermediates supplier. No concerns raised in last review | Active | 2027-03-31 | 4,200,000 |
| 2 | Dow Inc. | Long voluntary reporting history. Decarbonisation targets credible; circularity progress slower than peers | Volume concentration risk — single source for two grades | Active | 2027-01-15 | 3,850,000 |
| 3 | Evonik Industries AG | SBTi-committed. Portfolio sustainability assessment methodology is a strength | Reliable. Technical support rated highly by production | Active | 2026-11-30 | 2,100,000 |
| 4 | Clariant AG | Strong environmental disclosure and portfolio transition targets. Governance disclosure thorough | Premium pricing accepted for catalyst performance | Active | 2027-06-30 | 1,450,000 |
| 5 | Croda International plc | Best-in-class across all three pillars. Bio-based feedstock share is a genuine differentiator | Highest-scoring supplier in register. Candidate for case study | Active | 2027-09-30 | 980,000 |
| 6 | Covestro AG | Environmental disclosure strong. Social metrics thinner than peers; ownership change adds uncertainty | Monitor ownership transition for continuity of supply terms | In renewal | 2026-10-31 | 2,650,000 |
| 7 | Solvay SA | CSRD-compliant statement. Absolute emissions remain high given the process base | Soda ash volumes stable. Freight cost exposure | Active | 2027-04-30 | 1,780,000 |
| 8 | Eastman Chemical Company | Reporting adequate. Recycling technology promising but not yet reflected in operational metrics | Solvent supply steady. Pricing under review | Under review | 2026-12-31 | 1,320,000 |
| 9 | Meridian Solvents Ltd ⚠ | No published report. Environmental policy page is a single page with no metrics. Governance unverifiable | Cheapest source for two solvents. Sustainability flagged this as a risk in the Q2 review — purchasing pushing back on switching cost | Active | 2026-09-30 | 610,000 |
| 10 | Halbert Industrial Gases Inc ⚠ | EHS statement only. No emissions data published. Neutral rather than poor — insufficient evidence either way | Regional supplier, hard to replace on logistics | Active | 2027-02-28 | 740,000 |
| 11 | Tianhe Fine Chemicals Co. Ltd ⚠ | No published disclosure. EcoVadis bronze cited in correspondence but the assessment itself is not shared. Audit access refused in 2025 | **Escalation candidate.** Sustainability recommends dual-sourcing before renewal. Purchasing notes no qualified alternative at this price point | In renewal | 2026-09-15 | 520,000 |
| 12 | Northbridge Chemical Distribution ⚠ | Distributor — reports only at parent group level, so site-level performance is not visible. Social score reflects absent labour disclosure | Distribution partner, not a manufacturer. Scope limitations understood | Active | 2027-05-31 | 430,000 |
| 13 | Kessler Additive Werke GmbH ⚠ | Environmental data published and credible. **No governance disclosure — score withheld pending supplier response, requested 12 June 2026** | Awaiting governance questionnaire. Chase before renewal | Active | 2027-08-31 | 890,000 |
| 14 | Vasco Polymer Compounds SA ⚠ | *(blank — not yet assessed)* | Newly onboarded. Assessment scheduled for Q4 2026 | Active | 2027-10-31 | 275,000 |

Rows 11 and 13 are the ones to open in the demo. Row 11 shows purchasing and sustainability visibly disagreeing in the internal notes — exactly the content production control cannot see. Row 13 shows a deliberately withheld score with a reason, which is what a justification field is actually for.

---

## Contract status — proposed value list

This was open question 4 in Section 15. Proposed fixed list rather than free text:

`Active` · `In renewal` · `Under review` · `Expired`

Fixed values keep the filter usable and stop four people inventing four spellings of "active". Overrule if you want free text.

---

## Users and roles

Four users, matching Section 2 of the spec.

| Name | Role | Sees | Edits |
|---|---|---|---|
| Rebecca LeBlanc | `admin` | Everything | Everything, plus user management and permanent delete |
| *(name)* | `sustainability` | Everything | E, S, G, justification, internal notes |
| *(name)* | `purchasing` | Everything | Contract status, renewal date, annual spend, internal notes |
| *(name)* | `production_control` | Suppliers, scores, overall, report link | Nothing |

**Important sequencing point.** The `profiles` table cannot be seeded from a file. Each row must reference a real `auth.users` id, and those ids don't exist until the person is actually invited. So the order is:

1. Claude Code builds the tables, policies and trigger
2. **You** invite the four users from the Supabase dashboard — Authentication → Users → Invite
3. Roles are assigned to the resulting profile rows

That's a manual step in the middle of the build. Have the three colleagues' work email addresses to hand before you start the session, or invite yourself four times using plus-addressing (`rebecca+purchasing@lcaresource.com` and so on) to test all four roles without involving anyone else. For a first demo run I'd suggest exactly that — it lets you sit with four browser windows open and show the same supplier row rendering four different ways.

---

## Seeding notes for Claude Code

- **Do not seed `overall_score`.** It is derived per Section 9. If it appears in the seed data, the calculation isn't being tested.
- **Do not seed `change_log`.** It is written by a trigger. Seeding it directly would bypass the mechanism the tool exists to demonstrate.
- **Seed with empty strings as nulls**, not as `0` or `""` — particularly rows 13 and 14, which exist specifically to test null handling.
- **`is_archived`** is `false` for all fourteen rows. Archive one manually during testing rather than seeding an archived row, so the archive path gets exercised.
- After seeding, make a handful of edits as different roles before the demo, so the change log and the daily digest have something real to show.

---

## Verified report links

Checked reachable 31 July 2026. Links rot — re-check before any demo.

| Supplier | URL |
|---|---|
| BASF SE | `https://report.basf.com/2025/en/` |
| Dow Inc. | `https://corporate.dow.com/en-us/about-dow/corporate-reporting/progress-report.html` |
| Evonik Industries AG | `https://www.evonik.com/en/sustainability.html` |
| Clariant AG | `https://www.clariant.com/en/Company/Integrated-Report/Integrated-Report-2025` |
| Croda International plc | `https://www.croda.com/en-gb/investors/annual-report/2025/sustainability-progress-statement` |
| Covestro AG | `https://annualreport.covestro.com/annual-financial-report-2025/en/` |
| Solvay SA | `https://www.solvay.com/en/sustainability` |
| Eastman Chemical Company | `https://www.eastman.com/content/dam/eastman/corporate/en/media-center/resources/eastman-sustainability-report-2025.pdf` |

Landing and hub pages were chosen over deep PDF links where possible, because they survive the annual reporting cycle. The Eastman link is a direct PDF and is the most likely of the eight to move.

Fictional suppliers have no link. Rows 10, 12 and 13 are described as having partial disclosure but carry no URL — that's intentional, and it lets you demonstrate a supplier whose report field is empty while its scores are not.

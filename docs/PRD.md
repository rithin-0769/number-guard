# NumberGuard — Product Requirements Document

**Version:** 3.0 · **Supersedes:** 2.0 · **Status:** Approved for build
**Owner:** Rithin · **Original repo:** github.com/rithin-0769/number-guard

---

## 0. Changelog

| Version | Theme | Highlights |
|---|---|---|
| 1.0 (original repo) | MVP | Static service list, per-service done/pending toggle, UPI warning modal, WhatsApp broadcaster, localStorage vault. |
| **2.0 (rebuilt)** | Function first | Curated 30-service catalog with granular steps, exposure scoring, 90-day recycle clock, per-app UPI protocol, multi-vault, JSON export/import. |
| **3.0 (this build)** | Guidance + awareness | Guided setup, command palette, 90-day milestone plan, incident (lost/stolen SIM) lane, activity audit log, notes, exposure trend, risk donut, contact groups + bulk import, message templates, Markdown report export, light/dark themes, keyboard shortcuts, a11y pass. |

---

## 1. Problem

Indian telecom operators may recycle a mobile number **90 days after it goes inactive**. Accounts still bound to
that number — banks, UPI IDs, Aadhaar, PAN, WhatsApp, email recovery — become reachable by the next owner of the
SIM. The typical user has no inventory of these links, no sense of ordering, no deadline pressure, and no way to
prove (to themselves, a bank, or an employer) that the migration was completed.

**NumberGuard** is a privacy-first migration console. It converts "I'm changing my SIM" into a
**deadline-bound, auditable checklist**, and covers the emergency case where the SIM is already gone.

## 2. Goals & Non-Goals

**Goals**
- G1. Make the 90-day recycle deadline concrete and impossible to ignore.
- G2. Provide a correct, curated "where do I update this" catalog for the Indian ecosystem.
- G3. Track per-step progress and express residual risk as a single measurable number.
- G4. Guarantee UPI IDs (VPA) are migrated or retired *before* the number dies.
- G5. Tell the user **what to do next, in what order** — not just what exists.
- G6. Cover the incident case: SIM already lost/stolen → emergency lane, then migration.
- G7. Produce an auditable record of what was done and when.
- G8. 100% local: no accounts, no servers, zero runtime network calls.

**Non-Goals (v3)**
- No backend, auth, or cross-device sync (JSON export/import covers transfer).
- No automated account updates — the app routes the user to the correct portal and tracks the outcome.
- No live auditing of a user's real linked accounts (risk levels are expert-curated).
- No payments, no telemetry, no analytics.

## 3. Personas & Scenarios

**P1 · The switcher** — moving city/job, keeps the number 60 days, wants order and a deadline.
**P2 · The port-out user** — changing carriers, must clear bank OTPs before the cutover night.
**P3 · The incident victim** — phone stolen, SIM in someone else's hands, needs *today*.

| # | Scenario | Outcome |
|---|---|---|
| S1 | New user lands, wants to start in <2 min | Guided 3-step setup: old number → drop date → first scan |
| S2 | User sets the SIM drop date | 90-day deadline, countdown ring, milestone windows derived |
| S3 | User runs Smart Scan | Curated services added, deduped, grouped by category |
| S4 | User works the checklist, ticks granular steps | Exposure falls, activity log records it, trend chart updates |
| S5 | User open the UPI Protocol | Global VPA protocol + per-app clearance with tracking |
| S6 | User adds new number + contacts | Grouped contacts, templates, one-tap WhatsApp links |
| S7 | User wants to know "what now?" | Plan tab: 90-day milestones with due/overdue state + next actions |
| S8 | **Phone stolen** | Incident lane: block SIM, freeze UPI, secure criticals, file complaint — *then* migrate |
| S9 | Bank/employer asks for proof | Download Markdown status report with timestamps |
| S10 | User moves to a new laptop | Export vault JSON, re-import elsewhere |
| S11 | Night-shift user hates dark mode | Light theme toggle, persisted |

## 4. Functional Requirements

### F1 · Vault (identity & storage) — carried from v2, extended
- F1.1 10-digit Indian mobile validation (leading 6–9); old and new numbers.
- F1.2 One vault per number; multiple vaults coexist and switch instantly.
- F1.3 Non-destructive migration: vaults written by v2 auto-upgrade to the v3 schema on load (missing fields backfilled).
- F1.4 localStorage only; delete (confirmed), JSON export, JSON import.
- F1.5 Active vault remembered across reloads.

### F2 · Guided setup *(new in v3)*
- F2.1 Three-step wizard replaces the single form: **① Number & drop date → ② Quick profile (which categories do you use?) → ③ First scan**.
- F2.2 Each step validated before continuing; back/forward navigation; skippable.
- F2.3 Step ② pre-selects catalog categories that will be scanned at the end of setup.
- F2.4 Existing vaults are listed at step ① for instant reopen.

### F3 · Smart Scan — carried from v2
- F3.1 ~30 curated Indian services (category, risk, portal URL, granular steps).
- F3.2 Category-selectable, deduped by name, staged animation, exact added-count report.
- F3.3 Every scan is written to the activity log.

### F4 · Checklist & risk tracking — carried from v2, extended
- F4.1 Statuses pending / in-progress / done / skipped + checkable per-service steps.
- F4.2 Search, risk filter, status filter, category grouping, custom services.
- F4.3 Exposure score = weighted open work (Critical 25 · High 12 · Medium 6 · Low 2) as % of total.
- F4.4 **Per-service notes** *(new)*: free text (e.g. "branch visit, CIF 1234"); pinned indicator when a note exists; searchable.
- F4.5 Bulk actions *(new)*: mark all visible services in a category as done/skipped.

### F5 · Recycle risk visualizer — carried from v2, extended
- F5.1 Deadline = drop date + 90 days; countdown ring; urgency bands (calm >45d · warning 15–45d · critical ≤14d · missed <0).
- F5.2 **Exposure trend** *(new)*: daily snapshots of exposure + completion, rendered as a sparkline with first/last delta.
- F5.3 **Risk distribution donut** *(new)*: share of remaining work by risk level.
- F5.4 **Activity log** *(new)*: reverse-chronological audit trail (scan, status, steps, notes, contacts, exports, incident), capped at 200 entries, shown on the dashboard.
- F5.5 Next-best-actions engine (unchanged) + milestone summary strip.

### F6 · UPI safety protocol — carried from v2
- F6.1 Global 5-step VPA protocol (inventory → migrate/retire → update payers → settle → drop the SIM).
- F6.2 Per-app clearance panels for every tracked UPI app.
- F6.3 Hard warning while UPI apps remain open inside the critical window.

### F7 · WhatsApp broadcaster — carried from v2, extended
- F7.1 Template with `{old}`/`{new}` tokens, live preview, copy.
- F7.2 **Message presets** *(new)*: Friendly · Formal/Work · Family/Brief, one-tap switches.
- F7.3 **Contact groups** *(new)*: Family / Work / Finance / Other, with group chips, filter, and per-group notified progress.
- F7.4 **Bulk import** *(new)*: paste many rows (`Name, 98xxxxxxx` or bare numbers), parser reports added/skipped counts.
- F7.5 Per-contact `wa.me` deep link, notified tracking, copy-all-numbers.

### F8 · 90-day milestone plan *(new)*
- F8.1 Five milestone windows anchored to the recycle deadline: **M1 Freeze the bleeding (day 0–7)** → **M2 Money rails (8–30)** → **M3 Identity & government (31–60)** → **M4 Quiet the long tail (61–85)** → **M5 Final sweep (86–90)**.
- F8.2 Each milestone derives its own completion from the vault's real data (critical services done, UPI+banking done, ID+govt done, rest done, final-sweep conditions incl. new number + contacts notified).
- F8.3 Each milestone shows the calendar window, a due/overdue/upcoming/ahead state computed against today, a progress bar, and the specific open items.
- F8.4 Milestones are advisory: they never block the user.

### F9 · Incident lane — lost / stolen SIM *(new)*
- F9.1 Emergency checklist, visible from every screen via a header button.
- F9.2 Ordered steps: block the SIM with the operator (1900) → freeze UPI/netbanking → secure critical accounts & 2FA → file complaint (cybercrime.gov.in + FIR, 24h window) → rebuild on the new number → continue the standard migration.
- F9.3 Incident completion is tracked per vault and printed in the report; entering the lane can also mark the vault as an incident for urgency purposes.
- F9.4 Copyable operator/bank helpline reference numbers listed in the lane.

### F10 · Report & proof *(new)*
- F10.1 One-click **Markdown status report** download: vault summary, exposure + trend, per-category table with statuses, open criticals, UPI protocol state, incident state, milestone state, contacts notified, activity timestamps.
- F10.2 Report carries a generation date and the local-only privacy note.

### F11 · Command palette *(new)*
- F11.1 `⌘K` / `Ctrl+K` opens a fuzzy palette listing navigation, actions (scan, add service, incident, export, report, theme), and vault services (jump to + toggle).
- F11.2 Fully keyboard driven: arrows, Enter, Esc, and grouped results.

### F12 · Keyboard shortcuts & a11y *(new)*
- F12.1 `⌘/Ctrl+K` palette · `1…6` tabs · `T` theme · `N` add service · `S` scan · `?` shortcut sheet · `Esc` closes overlays.
- F12.2 Focus-visible rings on all interactive elements, `aria-label`s on icon-only buttons, `role=dialog`/`aria-modal` on overlays, live-region toasts, colour never the only status signal (status text + icon always present).

### F13 · Theming *(new)*
- F13.1 Dark (console) and Light (daylight) themes over an identical token set; toggle in header, sidebar and palette; persisted in `ng.theme`.
- F13.2 All semantic tokens flip: surfaces, lines, text tiers and accent *text* tiers keep ≥4.5:1 contrast on both themes.

### F14 · In-app spec
- F14.1 This PRD (condensed) is readable inside the app on the **Spec** tab.

## 5. Data Model (v3)

```
Vault   { phone, newNumber?, simDropDate, services[], contacts[], messageTemplate?,
          vpaDone[], activity[], snapshots[], incident?: { active, done[] },
          createdAt, updatedAt }

Service { id, name, category, risk, isUpi?, url, steps[], stepDone[], notes?, status,
          custom?, addedAt, doneAt? }

Contact { id, name, number, group: 'Family'|'Work'|'Finance'|'Other', notified }

Activity { id, at, kind, text }
Snapshot { date, exposure, done, total }

risk ∈ critical|high|medium|low · status ∈ pending|in_progress|done|skipped
global keys: ng.theme
```

## 6. UI / UX Requirements

- U1. Dark **security-console** identity with a working daylight counterpart; the phone number is the identity — no account wall.
- U2. Shell: sidebar (vault switcher, controls) · top bar (tabs, deadline pill, incident, scan, palette, theme) · responsive to mobile with a drawer.
- U3. Type system: Space Grotesk (display) · Manrope (UI) · JetBrains Mono (numbers, phone, IDs, dates).
- U4. Colour semantics: mint = safe/progress · gold = attention · coral = critical · sky = info; never decorative-only.
- U5. Motion communicates state only (scan sweep, ring, trend draw, toasts, palette) at 150–300ms ease-out.
- U6. Hierarchy over decoration: every screen leads with the decision the user must make next.
- U7. Density: information-rich but scannable — progress bars, badges and mono numerics over prose.
- U8. Every destructive action is confirmed; every completed action raises a toast (with undo where cheap).

## 7. Success Metrics

- M1. Median user reaches a scanned baseline within 2 minutes of first load.
- M2. ≥70% of criticals closed inside milestone M1 (day 0–7).
- M3. Every active vault reaches 0% exposure before the deadline — the app's whole job.
- M4. Zero runtime network calls; verified by inspection of the built bundle.
- M5. Palette (`⌘K`) or shortcut usage in the top tasks (scan, tab switch, theme).

## 8. Release Plan

- **v3.0 (this build):** §4 in full.
- **Backlog v4:** CSV contact import/export · Hindi + regional i18n · per-bank branch/helpline deep links · PWA install + offline reminders · shareable read-only progress image · multi-user "household vaults" for a family SIM.

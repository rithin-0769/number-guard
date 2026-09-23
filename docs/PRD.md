# NumberGuard — Product Requirements Document

**Version:** 2.0 (rebuild) · **Status:** Approved for build · **Owner:** Rithin (rebuild)
**Original repo:** github.com/rithin-0769/number-guard

---

## 1. Problem

In India, telecom operators are permitted to recycle mobile numbers after **90 days of
inactivity**. When a user discards a SIM, every account still bound to that number —
banks, UPI, Aadhaar, PAN, social, shopping — becomes reachable by whoever owns the
number next. The typical user has no systematic way to know *where* their number is
linked or *what order* to update things in.

**NumberGuard** is a privacy-first migration console that turns "swap my SIM" into a
tracked, deadline-bound checklist: scan the Indian service ecosystem, track every
account update against the 90-day recycle clock, run the UPI safety protocol, and
notify contacts about the new number.

## 2. Goals & Non-Goals

**Goals**
- G1. Make the 90-day recycle deadline concrete (countdown, urgency states).
- G2. Provide a curated, correct "where do I update my number" catalog for Indian services.
- G3. Track per-service and per-step progress with a measurable exposure (risk) score.
- G4. Guarantee UPI IDs are handled *before* the number is abandoned.
- G5. Notify the user's contacts via WhatsApp with a pre-formatted message.
- G6. Keep 100% of data in the browser (localStorage) — zero accounts, zero network calls.

**Non-Goals (v1)**
- No backend, no authentication, no cross-device sync (JSON export/import instead).
- No automated account updates (the tool drives the user to the right portal; the user completes the flow there).
- No real risk detection — risk levels are expert-curated, not live.

## 3. Users & Core Scenarios

**Primary user:** an Indian mobile subscriber discarding a number (job/relator move,
carrier switch, SIM loss, dual-SIM cleanup) 7–60 days before it gets recycled.

| # | Scenario | Outcome |
|---|----------|---------|
| S1 | U opens the app, enters old 10-digit number | A personal "vault" is created (or an existing one is opened) |
| S2 | U sets the SIM drop date | 90-day recycle deadline + live countdown is derived |
| S3 | U runs the Smart Scan | Curated Indian services are added to the checklist, deduped |
| S4 | U works through the checklist, checking granular steps | Exposure score falls; progress is persisted locally |
| S5 | U opens the UPI Protocol for GPay/PhonePe/Paytm/BHIM | Step-by-step VPA migration/deregistration is tracked |
| S6 | U adds the new number + contacts | Per-contact WhatsApp deep links + copyable message |
| S7 | U exports the vault as JSON | Backup / import on another device |

## 4. Functional Requirements

### 4.1 Vault (identity & storage)
- F1.1 Phone input validated as a 10-digit Indian mobile (leading digit 6–9).
- F1.2 One vault per number; multiple vaults can coexist and be switched instantly.
- F1.3 Vault fields: `phone`, `newNumber?`, `simDropDate`, `services[]`, `contacts[]`, `messageTemplate?`, timestamps.
- F1.4 All state persisted to `localStorage`; vault deletion and JSON export/import.
- F1.5 Active vault remembered across reloads.

### 4.2 Smart Scan
- F2.1 Curated catalog (~30 Indian services) with category, risk level, update URL, and per-service steps.
- F2.2 Scan adds catalog services missing from the vault, deduped by name.
- F2.3 User can restrict the scan to selected categories.
- F2.4 Scan runs a short staged animation and reports how many services were added.

### 4.3 Checklist & Risk Tracking
- F3.1 Four statuses: `pending → in_progress → done`, plus `skipped` ("I don't use this").
- F3.2 Each service exposes its curated steps as a checkable sub-list.
- F3.3 Search, risk filter, status filter, category grouping.
- F3.4 Exposure score = weighted remaining work (Critical 25 · High 12 · Medium 6 · Low 2) as % of total, updated live.
- F3.5 Custom services can be added (name, category, risk, URL, steps).
- F3.6 Every change persists immediately.

### 4.4 Recycle Risk Visualizer
- F4.1 Deadline = `simDropDate + 90d`; countdown in days with a 90-day progress ring.
- F4.2 Urgency bands: Calm (>45d), Warning (15–45d), Critical (≤14d), Window missed (<0).
- F4.3 Dashboard surfaces: countdown, exposure score + top pending criticals, per-category progress, critical watchlist with quick actions.

### 4.5 UPI Safety Protocol
- F5.1 Global VPA migration checklist (inventory → migrate/retire → update merchants → settle balances → only then drop the number).
- F5.2 Per-app protocol panels (GPay, PhonePe, Paytm, BHIM) with trackable steps.
- F5.3 A hard warning is shown whenever any UPI service is not `done` while the countdown is in the Critical band.

### 4.6 WhatsApp Broadcaster
- F6.1 Editable message template with `{old}` / `{new}` tokens.
- F6.2 Contact management: add (name + 10-digit number), mark notified, remove.
- F6.3 Per-contact `wa.me` deep link with the rendered message; "copy all numbers" and "copy message".

### 4.7 In-App Spec
- F7.1 The PRD (summary) is readable inside the app on a dedicated tab — this file, condensed.

## 5. Data Model

```
Vault { phone, newNumber?, simDropDate, services[], contacts[], messageTemplate?, createdAt, updatedAt }
Service { id, name, category, risk, isUpi?, url, steps[], stepDone[], status, custom?, addedAt, doneAt? }
Contact { id, name, number, notified }
```

Risk levels: `critical | high | medium | low`. Statuses: `pending | in_progress | done | skipped`.
Storage keys: `ng.vaults` (index), `ng.vault.<phone>` (payload), `ng.active` (active phone).

## 6. UI / UX Requirements

- U1. Dark "security console" aesthetic; single theme; no account wall — the number is the identity.
- U2. Layout: left sidebar (vault switcher + data controls) · top tab bar (Dashboard / Checklist / UPI Protocol / Broadcaster / Spec) · responsive down to mobile with a drawer sidebar.
- U3. Typography: Space Grotesk (display) · Manrope (UI) · JetBrains Mono (numbers, phone, dates).
- U4. Color semantics: mint = safe/progress · amber = warning/high · red-coral = critical · sky = info. No marketing blue/violet.
- U5. Motion only where it communicates state (scan animation, toasts, tab/card transitions, ring progress). 150–300ms, ease-out.
- U6. Every destructive action (delete service, delete vault, clear) requires confirmation.

## 7. Success Metrics

- M1. User completes the Smart Scan + sets the drop date in under 2 minutes.
- M2. 100% of vaults reach Exposure 0% before the recycle deadline (the app's whole job).
- M3. Zero user data leaves the browser (verifiable: no network calls at runtime).

## 8. Release Plan

- **v2.0 (this build):** everything in §4.
- **Backlog:** CSV contact import · per-bank "call the branch" notes · shareable read-only PNG of progress · i18n (Hindi) · PWA install.

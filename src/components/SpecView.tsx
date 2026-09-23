import type { ReactNode } from "react";
import { Command, Moon, PhoneCall, Table2 } from "lucide-react";
import { Kbd } from "./charts";

function Section({ n, title, children }: { n: string; title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-ink-850 p-5">
      <h2 className="flex items-baseline gap-3 font-display text-sm font-bold text-paper">
        <span className="font-mono text-[11px] text-mint-400">{n}</span>
        {title}
      </h2>
      <div className="mt-3 text-sm leading-relaxed text-mist">{children}</div>
    </section>
  );
}

function Req({ id, children }: { id: string; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 shrink-0 font-mono text-[10px] font-bold text-mint-400">{id}</span>
      <span>{children}</span>
    </li>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 font-display text-xs font-bold text-paper">{title}</p>
      <ul className="space-y-1.5">{children}</ul>
    </div>
  );
}

export function SpecView() {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="rounded-2xl border border-mint-500/25 bg-mint-500/[0.05] p-6">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-mint-400">
          Product requirements · v3.0
        </p>
        <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-paper">
          NumberGuard — what it is and why it exists
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-mist">
          Indian telecom operators may recycle a mobile number <b className="text-paper">90 days after it goes inactive</b>.
          Everything still bound to that number — banks, UPI IDs, Aadhaar, PAN, WhatsApp — can fall to its next owner.
          NumberGuard is a privacy-first migration console that turns a SIM swap into a deadline-bound, auditable
          checklist: guided setup, a curated service scan, a 90-day milestone plan, an emergency lane for a lost SIM,
          an activity log, and a downloadable proof-of-work report.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {["Local-only storage", "No accounts", "No network calls", "JSON backup", "Markdown report", "Light & dark"].map((t) => (
            <span key={t} className="rounded-full border border-line bg-ink-900/60 px-3 py-1 font-mono text-[10px] font-semibold text-mist">
              {t}
            </span>
          ))}
        </div>
      </div>

      <Section n="00" title="Changelog">
        <div className="overflow-x-auto">
          <table className="w-full min-w-105 border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-line font-mono text-[10px] uppercase tracking-wider text-faint">
                <th className="py-2 pr-4">Version</th>
                <th className="py-2 pr-4">Theme</th>
                <th className="py-2">What landed</th>
              </tr>
            </thead>
            <tbody className="align-top">
              {[
                ["1.0", "MVP", "Static service list, done/pending toggles, UPI warning, WhatsApp broadcaster, local vault."],
                ["2.0", "Function first", "Curated 30-service catalog with steps, exposure scoring, 90-day recycle clock, per-app UPI protocol, multi-vault, JSON export/import."],
                ["3.0", "Guidance + awareness", "Guided setup, command palette, milestone plan, incident lane, activity log, notes, trend + donut charts, contact groups & bulk import, message presets, report export, themes, shortcuts, a11y pass."],
              ].map(([v, t, w]) => (
                <tr key={v} className="border-b border-line-soft">
                  <td className="py-2.5 pr-4 font-mono text-mint-400">{v}</td>
                  <td className="py-2.5 pr-4 text-paper">{t}</td>
                  <td className="py-2.5">{w}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section n="01" title="Goals & non-goals">
        <ul className="space-y-2">
          <li>
            <b className="text-mint-300">Goals —</b> make the 90-day deadline concrete; curate a correct "where do I
            update this" catalog; express residual risk as one number; guarantee UPI IDs are handled before the number
            dies; say what to do next and in what order; cover the lost-SIM emergency; leave an auditable record;
            keep everything on-device.
          </li>
          <li>
            <b className="text-flare-300">Non-goals —</b> no backend, auth or cloud sync; no automated account updates
            (the app routes you to the right portal and tracks the outcome); no live audit of your linked accounts —
            risk levels are expert-curated; no payments, telemetry or analytics.
          </li>
        </ul>
      </Section>

      <Section n="02" title="Personas & scenarios">
        <p className="mb-2">
          <b className="text-paper">P1 The switcher</b> (moving city/job) · <b className="text-paper">P2 The port-out user</b>{" "}
          (changing carriers) · <b className="text-paper">P3 The incident victim</b> (phone stolen — needs today).
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-105 border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-line font-mono text-[10px] uppercase tracking-wider text-faint">
                <th className="py-2 pr-4">#</th>
                <th className="py-2 pr-4">Scenario</th>
                <th className="py-2">Outcome</th>
              </tr>
            </thead>
            <tbody className="align-top">
              {[
                ["S1", "New user, wants to start in under two minutes", "Guided 3-step setup: number → drop date → first scan"],
                ["S2", "Set the SIM drop date", "Deadline, countdown ring and milestone windows derived"],
                ["S3", "Run the Smart Scan", "Curated services added, deduped, grouped by category"],
                ["S4", "Tick granular steps", "Exposure falls, activity log records it, trend updates"],
                ["S5", "Open the UPI protocol", "Global VPA checklist + per-app clearance tracked"],
                ["S6", "Add new number + contacts", "Grouped contacts, presets, one-tap WhatsApp links"],
                ["S7", "Ask “what now?”", "Plan tab: milestones with due/overdue state and next actions"],
                ["S8", "Phone stolen", "Incident lane: block SIM, freeze UPI, secure, complain, then migrate"],
                ["S9", "Bank asks for proof", "Markdown report with per-service states and timestamps"],
                ["S10", "Move devices", "Export vault JSON, import elsewhere"],
                ["S11", "Prefers daylight", "Persisted light theme across the whole console"],
              ].map(([n, s, o]) => (
                <tr key={n} className="border-b border-line-soft">
                  <td className="py-2.5 pr-4 font-mono text-mint-400">{n}</td>
                  <td className="py-2.5 pr-4 text-paper">{s}</td>
                  <td className="py-2.5">{o}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section n="03" title="Functional spec">
        <div className="space-y-4">
          <Group title="Vault & storage">
            <Req id="F1.1">10-digit Indian mobile validation (leading 6–9) for old and new numbers.</Req>
            <Req id="F1.2">One vault per number; multiple vaults coexist and switch instantly.</Req>
            <Req id="F1.3">Non-destructive migration: v2 vaults upgrade to the v3 schema on load, fields backfilled.</Req>
            <Req id="F1.4">localStorage only; confirmed delete, JSON export and import.</Req>
          </Group>
          <Group title="Guided setup">
            <Req id="F2.1">Three steps — number & drop date → usage profile → scan & launch — each validated.</Req>
            <Req id="F2.2">Step ② pre-selects catalog categories that are scanned on creation.</Req>
            <Req id="F2.3">Existing vaults are listed for one-click reopen.</Req>
          </Group>
          <Group title="Smart scan">
            <Req id="F3.1">~30 curated Indian services with category, risk, portal URL and granular steps.</Req>
            <Req id="F3.2">Category-selectable, deduped by name, staged animation, exact added-count report.</Req>
            <Req id="F3.3">Every scan is written to the activity log.</Req>
          </Group>
          <Group title="Checklist & risk tracking">
            <Req id="F4.1">Statuses pending / in-progress / done / not-applicable, plus checkable per-service steps.</Req>
            <Req id="F4.2">Search (incl. notes), risk and status filters, category grouping, custom services.</Req>
            <Req id="F4.3">Exposure score = weighted open work (critical 25 · high 12 · medium 6 · low 2) as % of total.</Req>
            <Req id="F4.4">Per-service notes are searchable and carried into the report.</Req>
            <Req id="F4.5">Bulk actions per category: close all, or mark the whole category not applicable.</Req>
          </Group>
          <Group title="Recycle risk visualizer">
            <Req id="F5.1">Deadline = drop date + 90 days; countdown ring; urgency bands calm / warning / critical / missed.</Req>
            <Req id="F5.2">Exposure trend sparkline from daily snapshots, with delta since the first data point.</Req>
            <Req id="F5.3">Risk-distribution donut showing where the remaining weight actually sits.</Req>
            <Req id="F5.4">Activity log (capped at 200 entries) on the dashboard and in the report.</Req>
            <Req id="F5.5">Next-best-actions engine and critical watchlist with quick actions.</Req>
          </Group>
          <Group title="UPI safety protocol">
            <Req id="F6.1">Global 5-step VPA protocol: inventory → migrate/retire → update payers → settle → gate.</Req>
            <Req id="F6.2">Per-app clearance panels for every tracked UPI app.</Req>
            <Req id="F6.3">Hard warning while UPI apps remain open inside the critical window.</Req>
          </Group>
          <Group title="WhatsApp broadcaster">
            <Req id="F7.1">Template with {"{old}"}/{"{new}"} tokens, live preview, copy-to-clipboard.</Req>
            <Req id="F7.2">Presets: Friendly, Formal/Work, Family/Brief.</Req>
            <Req id="F7.3">Contact groups (Family · Work · Finance · Other) with filters and notified progress.</Req>
            <Req id="F7.4">Bulk paste import — “Name, 98xxxxxxx” per line, duplicates and junk skipped.</Req>
            <Req id="F7.5">Per-contact wa.me deep link and copy-all-numbers.</Req>
          </Group>
          <Group title="90-day milestone plan">
            <Req id="F8.1">M1 Freeze the bleeding (0–7) → M2 Money rails (8–30) → M3 Identity & government (31–60) → M4 Long tail (61–85) → M5 Final sweep (86–90).</Req>
            <Req id="F8.2">Each milestone derives completion from real vault data and reports its window, state and open items.</Req>
            <Req id="F8.3">Advisory only — overdue is a signal, never a wall.</Req>
          </Group>
          <Group title="Incident lane">
            <Req id="F9.1">Emergency checklist reachable from the header, dashboard, plan, sidebar and palette.</Req>
            <Req id="F9.2">Block the SIM (1900) → freeze UPI/cards → secure criticals → online + police complaint → rebuild → migrate.</Req>
            <Req id="F9.3">Flagged incidents escalate the exposure messaging and appear in the report.</Req>
          </Group>
          <Group title="Report, palette, theming & a11y">
            <Req id="F10.1">One-click Markdown report: summary, categories, open services, UPI, incident, milestones, activity.</Req>
            <Req id="F11.1">Command palette on ⌘K / Ctrl+K: navigate, run actions, jump to and toggle services.</Req>
            <Req id="F12.1">Shortcuts: 1…6 tabs, S scan, N add service, T theme, ! incident, ? shortcut sheet, Esc closes.</Req>
            <Req id="F12.2">Focus-visible rings, aria labels, dialog semantics, live-region toasts; colour is never the only status signal.</Req>
            <Req id="F13.1">Dark and light themes over one token set, persisted in ng.theme.</Req>
          </Group>
        </div>
      </Section>

      <Section n="04" title="Data model & storage">
        <pre className="overflow-x-auto rounded-xl border border-line bg-ink-950 p-4 font-mono text-[11px] leading-relaxed text-mint-200">
{`Vault   { phone, newNumber?, simDropDate, services[], contacts[], messageTemplate?,
          vpaDone[], activity[], snapshots[], incident{ active, done[] },
          createdAt, updatedAt }
Service { id, name, category, risk, isUpi?, url, steps[], stepDone[],
          notes?, status, custom?, addedAt, doneAt? }
Contact { id, name, number, group, notified }
Activity{ id, at, kind, text }        Snapshot{ date, exposure, done, total }

risk ∈ critical|high|medium|low · status ∈ pending|in_progress|done|skipped
group ∈ Family|Work|Finance|Other

keys   ng.vaults → [phone…]   ng.vault.<phone> → Vault
       ng.active → active phone   ng.theme → dark|light`}
        </pre>
      </Section>

      <Section n="05" title="Design rules & success metrics">
        <ul className="space-y-1.5">
          <Req id="U1">The phone number is the identity — no account wall, no signup.</Req>
          <Req id="U2">Colour carries meaning: mint safe · gold attention · coral critical · sky info.</Req>
          <Req id="U3">Motion only where it communicates state — scan sweep, rings, trend draw, toasts. 150–300ms ease-out.</Req>
          <Req id="U4">Hierarchy over decoration: every screen leads with the next decision.</Req>
          <Req id="U5">Destructive actions are confirmed; completed actions raise a toast.</Req>
          <Req id="M1">A user reaches a scanned baseline within two minutes of first load.</Req>
          <Req id="M2">Most criticals close inside M1 (day 0–7).</Req>
          <Req id="M3">Every vault reaches 0% exposure before the deadline — the app's whole job.</Req>
          <Req id="M4">Zero runtime network calls (M5) — verified against the built bundle.</Req>
        </ul>
      </Section>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { icon: <Command size={16} />, t: "⌘K", d: "Command palette" },
          { icon: <PhoneCall size={16} />, t: "!", d: "Incident lane" },
          { icon: <Moon size={16} />, t: "T", d: "Toggle theme" },
        ].map((k) => (
          <div key={k.t} className="flex items-center gap-3 rounded-xl border border-line bg-ink-850 px-4 py-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-ink-800 text-mint-400">
              {k.icon}
            </span>
            <span>
              <Kbd>{k.t}</Kbd>
              <span className="ml-2 text-xs font-semibold text-mist">{k.d}</span>
            </span>
          </div>
        ))}
      </div>

      <p className="flex items-center gap-2 pb-2 font-mono text-[10px] text-faint">
        <Table2 size={11} /> Full document: docs/PRD.md · v3.0
      </p>
    </div>
  );
}

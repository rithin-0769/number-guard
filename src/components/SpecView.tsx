import type { ReactNode } from "react";

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

export function SpecView() {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="rounded-2xl border border-mint-500/25 bg-mint-500/[0.05] p-6">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-mint-400">Product requirements · v2.0</p>
        <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-paper">NumberGuard — what it is and why it exists</h1>
        <p className="mt-3 text-sm leading-relaxed text-mist">
          Indian telecom operators may recycle a mobile number <b className="text-paper">90 days after it goes inactive</b>.
          Everything still bound to that number — banks, UPI, Aadhaar, PAN, WhatsApp — can fall to its next owner.
          NumberGuard is a privacy-first migration console that turns a SIM swap into a deadline-bound checklist:
          scan the ecosystem, track every update against the recycle clock, run the UPI safety protocol, and notify
          contacts of the new number.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {["Local-only storage", "No accounts", "No network calls", "JSON backup"].map((t) => (
            <span key={t} className="rounded-full border border-line bg-ink-900/60 px-3 py-1 font-mono text-[10px] font-semibold text-mist">
              {t}
            </span>
          ))}
        </div>
      </div>

      <Section n="01" title="Goals & non-goals">
        <ul className="space-y-2">
          <li><b className="text-mint-300">Goals —</b> make the 90-day deadline concrete; provide a correct "where do I update" catalog for Indian services; track per-step progress with a measurable exposure score; guarantee UPI IDs are handled before the number dies; notify contacts via WhatsApp; keep 100% of data in the browser.</li>
          <li><b className="text-flare-300">Non-goals —</b> no backend, auth or cloud sync (JSON export/import instead); no automated account updates (the app drives you to the right portal, you finish the flow there); risk levels are expert-curated, not live-detected.</li>
        </ul>
      </Section>

      <Section n="02" title="User scenarios">
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
                ["S1", "Enter the old 10-digit number", "A private vault is created, or an existing one is opened"],
                ["S2", "Set the SIM drop date", "Recycle deadline and live 90-day countdown are derived"],
                ["S3", "Run the Smart Scan", "Curated Indian services join the checklist, deduped"],
                ["S4", "Work the checklist, ticking granular steps", "Exposure score falls; everything persists locally"],
                ["S5", "Open the UPI Protocol for GPay / PhonePe / Paytm / BHIM", "VPA migration or deregistration is tracked step by step"],
                ["S6", "Add the new number and contacts", "One-tap WhatsApp deep links with a rendered message"],
                ["S7", "Export the vault as JSON", "Backup, or import on another device"],
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
          <div>
            <p className="mb-1.5 font-display text-xs font-bold text-paper">Vault & storage</p>
            <ul className="space-y-1.5">
              <Req id="F1.1">Phone validated as a 10-digit Indian mobile (leading digit 6–9).</Req>
              <Req id="F1.2">One vault per number; multiple vaults coexist and switch instantly.</Req>
              <Req id="F1.3">Vault holds phone, new number, SIM drop date, services, contacts, message template, timestamps.</Req>
              <Req id="F1.4">Everything in localStorage; delete, JSON export and import supported.</Req>
            </ul>
          </div>
          <div>
            <p className="mb-1.5 font-display text-xs font-bold text-paper">Smart scan</p>
            <ul className="space-y-1.5">
              <Req id="F2.1">Curated catalog of ~30 Indian services with category, risk, update URL and steps.</Req>
              <Req id="F2.2">Scan adds missing catalog services, deduped by name, restricted to chosen categories.</Req>
              <Req id="F2.3">Short staged scan animation; reports exactly how many services were added.</Req>
            </ul>
          </div>
          <div>
            <p className="mb-1.5 font-display text-xs font-bold text-paper">Checklist & risk tracking</p>
            <ul className="space-y-1.5">
              <Req id="F3.1">Four statuses — pending, in progress, done, skipped — plus checkable per-service steps.</Req>
              <Req id="F3.2">Search, risk filter, status filter, category grouping, custom services.</Req>
              <Req id="F3.3">Exposure score = weighted open work (Critical 25 · High 12 · Medium 6 · Low 2) as % of total, live.</Req>
            </ul>
          </div>
          <div>
            <p className="mb-1.5 font-display text-xs font-bold text-paper">Recycle risk visualizer</p>
            <ul className="space-y-1.5">
              <Req id="F4.1">Deadline = SIM drop date + 90 days; day countdown with a 90-day progress ring.</Req>
              <Req id="F4.2">Urgency bands — calm &gt;45d, warning 15–45d, critical ≤14d, missed &lt;0 — drive the banner and ring color.</Req>
              <Req id="F4.3">Dashboard shows countdown, exposure + top pending, per-category progress, critical watchlist and next best actions.</Req>
            </ul>
          </div>
          <div>
            <p className="mb-1.5 font-display text-xs font-bold text-paper">UPI safety protocol</p>
            <ul className="space-y-1.5">
              <Req id="F5.1">Global VPA migration checklist: inventory → migrate/retire → update payers → settle balances → drop the SIM.</Req>
              <Req id="F5.2">Per-app clearance panels for every tracked UPI app, with trackable steps.</Req>
              <Req id="F5.3">Hard warning whenever UPI apps stay open inside the critical window.</Req>
            </ul>
          </div>
          <div>
            <p className="mb-1.5 font-display text-xs font-bold text-paper">WhatsApp broadcaster</p>
            <ul className="space-y-1.5">
              <Req id="F6.1">Editable template with {"{old}"}/{"{new}"} tokens and a live preview.</Req>
              <Req id="F6.2">Contact management with notified tracking; per-contact wa.me deep links; bulk copy of numbers.</Req>
            </ul>
          </div>
        </div>
      </Section>

      <Section n="04" title="Data model & storage">
        <pre className="overflow-x-auto rounded-xl border border-line bg-ink-950 p-4 font-mono text-[11px] leading-relaxed text-mint-200">
{`Vault   { phone, newNumber?, simDropDate, services[], contacts[],
          messageTemplate?, vpaDone[], createdAt, updatedAt }
Service { id, name, category, risk, isUpi?, url, steps[], stepDone[],
          status, custom?, addedAt, doneAt? }
Contact { id, name, number, notified }

risk   ∈ critical | high | medium | low
status ∈ pending | in_progress | done | skipped

keys   ng.vaults            → [phone…]
       ng.vault.<phone>     → Vault
       ng.active            → active phone`}
        </pre>
      </Section>

      <Section n="05" title="Design rules & success metrics">
        <ul className="space-y-1.5">
          <Req id="U1">Dark security-console aesthetic; the phone number is the identity — no account wall.</Req>
          <Req id="U2">Color carries meaning: mint = safe/progress, gold = warning, red-coral = critical, sky = info.</Req>
          <Req id="U3">Motion only where it communicates state — scan, toasts, transitions. 150–300ms, ease-out.</Req>
          <Req id="M1">A user reaches a scanned baseline in under two minutes.</Req>
          <Req id="M2">Every vault reaches 0% exposure before the deadline — that is the whole job.</Req>
          <Req id="M3">Zero user data leaves the browser; there are no runtime network calls.</Req>
        </ul>
      </Section>
    </div>
  );
}

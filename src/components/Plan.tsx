import { motion } from "framer-motion";
import { AlertOctagon, CalendarClock, Check, Clock3, Flag, PhoneCall, ShieldCheck } from "lucide-react";
import { cn } from "../utils/cn";
import { daysSince, daysUntilRecycle, fmtDateLong, milestoneStates, toISODate, recycleDeadline } from "../lib/storage";
import { INCIDENT_STEPS } from "../data/plan";
import type { Vault } from "../types";
import { Button, Progress, RiskBadge } from "./ui";

const STATE_STYLE: Record<string, { label: string; cls: string; dot: string }> = {
  done: { label: "complete", cls: "border-mint-500/30 bg-mint-500/10 text-mint-300", dot: "bg-mint-400" },
  due: { label: "due now", cls: "border-gold-400/40 bg-gold-400/10 text-gold-300", dot: "bg-gold-400" },
  overdue: { label: "overdue", cls: "border-flare-500/40 bg-flare-500/10 text-flare-300", dot: "bg-flare-500" },
  upcoming: { label: "upcoming", cls: "border-line bg-ink-800 text-mist", dot: "bg-ink-600" },
  ahead: { label: "ahead of schedule", cls: "border-skyx-400/30 bg-skyx-400/10 text-skyx-300", dot: "bg-skyx-400" },
};

export function Plan({
  vault,
  onToggleIncident,
  onSetIncidentActive,
  onGoChecklist,
  onGoUpi,
}: {
  vault: Vault;
  onToggleIncident: (id: string) => void;
  onSetIncidentActive: (active: boolean) => void;
  onGoChecklist: () => void;
  onGoUpi: () => void;
}) {
  const daysLeft = daysUntilRecycle(vault.simDropDate);
  const offset = Math.max(0, daysSince(vault.createdAt));
  const milestones = milestoneStates(vault, daysLeft);
  const dayInWindow = Math.max(0, 90 - daysLeft);
  const position = Math.min(100, Math.max(0, (dayInWindow / 90) * 100));
  const incidentDone = vault.incident.done.length;

  return (
    <div className="space-y-5">
      {/* timeline header */}
      <section className="rounded-2xl border border-line bg-ink-850 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-display text-sm font-semibold text-paper">
            <CalendarClock size={15} className="text-mist" /> The 90-day window
          </h2>
          <span className="font-mono text-[11px] font-semibold text-mist">
            day {dayInWindow} of 90 · started {offset}d ago · deadline {fmtDateLong(toISODate(recycleDeadline(vault.simDropDate)))}
          </span>
        </div>

        <div className="relative mt-5">
          <div className="h-2 w-full overflow-hidden rounded-full bg-ink-700">
            <motion.div
              className="h-full rounded-full bg-mint-500"
              initial={{ width: 0 }}
              animate={{ width: `${position}%` }}
              transition={{ type: "spring", stiffness: 60, damping: 18 }}
            />
          </div>
          <div className="absolute -top-6 flex flex-col items-center" style={{ left: `calc(${position}% - 10px)` }}>
            <span className="font-mono text-[9px] font-bold text-mint-300">today</span>
          </div>
          <div className="mt-2 flex justify-between font-mono text-[10px] text-faint">
            {milestones.map((m) => (
              <span key={m.id} className="flex-1 text-center first:text-left last:text-right">
                {m.code}
                <span className="hidden sm:inline"> · day {m.from}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        {/* milestone list */}
        <section className="space-y-3">
          {milestones.map((m, i) => {
            const st = STATE_STYLE[m.complete ? "done" : m.state];
            const prog = m.totalCount === 0 ? 0 : m.doneCount / m.totalCount;
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  "relative rounded-2xl border bg-ink-850 p-5 pl-6 transition-colors",
                  m.complete ? "border-mint-500/25" : m.state === "overdue" ? "border-flare-500/25" : m.state === "due" ? "border-gold-400/25" : "border-line",
                )}
              >
                <span className={cn("absolute left-0 top-5 h-[calc(100%-2.5rem)] w-0.5 rounded-full", st.dot)} />
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-faint">{m.code}</span>
                      <span className="font-display text-[15px] font-bold text-paper">{m.title}</span>
                      <span className={cn("rounded-full border px-2 py-px font-mono text-[10px] font-bold uppercase", st.cls)}>{st.label}</span>
                    </p>
                    <p className="mt-1 font-mono text-[11px] text-mist">day {m.from}–{m.to} · {m.daysLabel}</p>
                  </div>
                  <span className="font-mono text-xs font-bold text-paper">
                    {m.doneCount}/{m.totalCount}
                  </span>
                </div>

                <p className="mt-2.5 text-xs leading-relaxed text-mist">{m.summary}</p>
                <p className="mt-1.5 font-mono text-[10px] uppercase tracking-wide text-faint">focus · {m.focus}</p>
                <div className="mt-3">
                  <Progress value={prog} tone={m.complete ? "mint" : m.state === "overdue" ? "flare" : "gold"} />
                </div>

                {m.openItems.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {m.openItems.map((s) => (
                      <span key={s.id} className="flex items-center gap-1.5 rounded-lg border border-line bg-ink-900/60 px-2 py-1 text-[11px] font-semibold text-mist">
                        <RiskBadge risk={s.risk} /> {s.name}
                      </span>
                    ))}
                    {m.doneCount < m.totalCount - m.openItems.length && (
                      <span className="px-2 py-1 text-[11px] text-faint">+{m.totalCount - m.doneCount - m.openItems.length} more</span>
                    )}
                  </div>
                )}

                {m.complete && (
                  <p className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-mint-300">
                    <Check size={12} strokeWidth={3} /> Closed out
                  </p>
                )}
              </motion.div>
            );
          })}
        </section>

        {/* right column */}
        <div className="space-y-5">
          {/* incident lane */}
          <section className="rounded-2xl border border-flare-500/25 bg-ink-850 p-5">
            <div className="flex items-start justify-between gap-3">
              <h2 className="flex items-center gap-2 font-display text-sm font-semibold text-paper">
                <PhoneCall size={15} className="text-flare-400" /> SIM lost or stolen?
              </h2>
              <span className="font-mono text-[11px] font-bold text-mist">
                {incidentDone}/{INCIDENT_STEPS.length}
              </span>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-mist">
              An active SIM in the wrong hands is a live threat, not a 90-day deadline. Work this lane first — it takes
              about an hour and it is the difference between an inconvenience and an empty bank account.
            </p>

            <div className="mt-3">
              <Progress value={incidentDone / INCIDENT_STEPS.length} tone="flare" />
            </div>

            <div className="mt-4 space-y-1.5">
              {INCIDENT_STEPS.map((s, i) => {
                const done = vault.incident.done.includes(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => onToggleIncident(s.id)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-colors",
                      done ? "border-mint-500/20 bg-mint-500/5" : "border-line bg-ink-900/50 hover:border-ink-600",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border font-mono text-[10px] font-bold",
                        done ? "border-mint-500 bg-mint-500 text-ink-950" : "border-ink-600 text-faint",
                      )}
                    >
                      {done ? <Check size={12} strokeWidth={3.5} /> : i + 1}
                    </span>
                    <span className="min-w-0">
                      <span className={cn("flex flex-wrap items-center gap-2 text-xs font-bold", done ? "text-mist line-through" : "text-paper")}>
                        {s.title}
                        {s.window && <span className="rounded border border-flare-500/25 bg-flare-500/10 px-1.5 py-px font-mono text-[9px] font-semibold uppercase text-flare-300">{s.window}</span>}
                      </span>
                      <span className="mt-1 block text-[11px] leading-relaxed text-mist">{s.detail}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex items-center justify-between rounded-xl border border-line-soft bg-ink-900/50 px-3.5 py-2.5">
              <div>
                <p className="text-xs font-bold text-paper">Mark this vault as an incident</p>
                <p className="text-[11px] text-faint">Flags the exposure banner and the report</p>
              </div>
              <button
                onClick={() => onSetIncidentActive(!vault.incident.active)}
                aria-pressed={vault.incident.active}
                className={cn(
                  "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                  vault.incident.active ? "bg-flare-500" : "bg-ink-600",
                )}
              >
                <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all", vault.incident.active ? "left-5.5" : "left-0.5")} />
              </button>
            </div>

            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="danger" className="flex-1" onClick={onGoUpi} icon={<ShieldCheck size={13} />}>
                Open UPI protocol
              </Button>
              <Button size="sm" variant="outline" className="flex-1" onClick={onGoChecklist} icon={<Flag size={13} />}>
                Open checklist
              </Button>
            </div>
          </section>

          {/* how the plan works */}
          <section className="rounded-2xl border border-line bg-ink-850 p-5">
            <h2 className="flex items-center gap-2 font-display text-sm font-semibold text-paper">
              <Clock3 size={15} className="text-mist" /> How the plan reads
            </h2>
            <ul className="mt-3 space-y-2 text-xs leading-relaxed text-mist">
              <li className="flex gap-2"><AlertOctagon size={13} className="mt-0.5 shrink-0 text-flare-400" /> Critical work every single day, from day 0 — money and identity first.</li>
              <li className="flex gap-2"><Clock3 size={13} className="mt-0.5 shrink-0 text-gold-400" /> Government portals are slow — Aadhaar and PAN get a 30-day head start.</li>
              <li className="flex gap-2"><Check size={13} className="mt-0.5 shrink-0 text-mint-400" /> Milestones are advisory. Nothing here blocks you — overdue is a signal, not a wall.</li>
            </ul>
            <p className="mt-3 rounded-lg border border-line-soft bg-ink-900/50 px-3 py-2 text-[11px] text-faint">
              Windows are anchored to your SIM drop date, so shifting that date re-plans everything instantly.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertOctagon,
  ArrowRight,
  CalendarClock,
  CheckCheck,
  Clock3,
  ExternalLink,
  FileText,
  ListChecks,
  MessageSquareText,
  Radar,
  ScanLine,
  ShieldCheck,
} from "lucide-react";
import { cn } from "../utils/cn";
import {
  daysUntilRecycle,
  fmtActivityTime,
  fmtDateLong,
  fmtPhone,
  milestoneStates,
  recycleDeadline,
  riskReport,
  scoreLabel,
  toISODate,
  urgencyOf,
} from "../lib/storage";
import type { Urgency } from "../lib/storage";
import type { Activity, TabId, Vault } from "../types";
import { RiskDonut, TrendSpark } from "./charts";
import { Button, Progress, RiskBadge, toneText } from "./ui";

const urgencyTone: Record<Urgency, string> = {
  calm: "text-mint-300",
  warning: "text-gold-300",
  critical: "text-flare-300",
  missed: "text-flare-400",
  cleared: "text-mint-300",
};

const urgencyRing: Record<Urgency, string> = {
  calm: "var(--color-mint-500)",
  warning: "var(--color-gold-400)",
  critical: "var(--color-flare-500)",
  missed: "var(--color-flare-400)",
  cleared: "var(--color-mint-500)",
};

function CountdownRing({ daysLeft, urgency }: { daysLeft: number; urgency: Urgency }) {
  const R = 62;
  const C = 2 * Math.PI * R;
  const elapsed = Math.min(1, Math.max(0, (90 - daysLeft) / 90));
  return (
    <div className="relative h-40 w-40 shrink-0">
      <svg viewBox="0 0 150 150" className="h-full w-full -rotate-90">
        <circle cx="75" cy="75" r={R} fill="none" stroke="var(--color-ink-700)" strokeWidth="9" />
        <motion.circle
          cx="75"
          cy="75"
          r={R}
          fill="none"
          stroke={urgencyRing[urgency]}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={C}
          initial={false}
          animate={{ strokeDashoffset: C * (1 - elapsed) }}
          transition={{ type: "spring", stiffness: 60, damping: 16 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("font-mono text-4xl font-bold leading-none", urgencyTone[urgency])}>{daysLeft < 0 ? 0 : daysLeft}</span>
        <span className="mt-1 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-faint">
          {daysLeft < 0 ? "days past" : "days left"}
        </span>
      </div>
    </div>
  );
}

const KIND_ICON: Record<Activity["kind"], React.ReactNode> = {
  created: <Radar size={12} />,
  scan: <ScanLine size={12} />,
  status: <CheckCheck size={12} />,
  step: <ListChecks size={12} />,
  note: <FileText size={12} />,
  contact: <MessageSquareText size={12} />,
  vpa: <ShieldCheck size={12} />,
  date: <CalendarClock size={12} />,
  data: <FileText size={12} />,
  incident: <AlertOctagon size={12} />,
};

const KIND_TONE: Partial<Record<Activity["kind"], string>> = {
  created: "bg-mint-500/12 text-mint-300",
  scan: "bg-skyx-400/12 text-skyx-300",
  status: "bg-mint-500/12 text-mint-300",
  step: "bg-ink-700 text-mist",
  note: "bg-gold-400/12 text-gold-300",
  contact: "bg-skyx-400/12 text-skyx-300",
  vpa: "bg-skyx-400/12 text-skyx-300",
  date: "bg-gold-400/12 text-gold-300",
  data: "bg-ink-700 text-mist",
  incident: "bg-flare-500/12 text-flare-300",
};

export function Dashboard({
  vault,
  onDropDate,
  onScan,
  onMarkDone,
  onGoTab,
  onReport,
}: {
  vault: Vault;
  onDropDate: (iso: string) => void;
  onScan: () => void;
  onMarkDone: (id: string) => void;
  onGoTab: (tab: TabId) => void;
  onReport: () => void;
}) {
  const report = riskReport(vault.services);
  const daysLeft = daysUntilRecycle(vault.simDropDate);
  const exposure = report.score;
  const urgency = urgencyOf(daysLeft, exposure);
  const sl = scoreLabel(exposure);
  const deadline = fmtDateLong(toISODate(recycleDeadline(vault.simDropDate)));
  const pendingCritical = vault.services.filter((s) => s.risk === "critical" && s.status !== "done" && s.status !== "skipped");
  const pendingUpi = vault.services.filter((s) => s.isUpi && s.status !== "done" && s.status !== "skipped");
  const unnotified = vault.contacts.filter((c) => !c.notified).length;
  const milestones = milestoneStates(vault, daysLeft);
  const nextMilestone = milestones.find((m) => !m.complete);
  const activity = vault.activity.slice(0, 9);

  const actions: { icon: React.ReactNode; label: string; detail: string; run: () => void }[] = [];
  if (vault.incident.active && vault.incident.done.length < 6)
    actions.push({
      icon: <AlertOctagon size={15} />,
      label: "Finish the incident lane",
      detail: "Active incident — block the SIM and freeze UPI first",
      run: () => onGoTab("plan"),
    });
  if (vault.services.length === 0) {
    actions.push({
      icon: <ScanLine size={15} />,
      label: "Run the Smart Scan",
      detail: "Build your baseline from the Indian service catalog",
      run: onScan,
    });
  } else {
    if (pendingCritical.length > 0)
      actions.push({
        icon: <ListChecks size={15} />,
        label: `Close ${pendingCritical[0].name}`,
        detail: `${pendingCritical.length} critical service${pendingCritical.length > 1 ? "s" : ""} still open`,
        run: () => onGoTab("checklist"),
      });
    if (pendingUpi.length > 0)
      actions.push({
        icon: <ShieldCheck size={15} />,
        label: "Run the UPI safety protocol",
        detail: "Migrate or retire VPA IDs before the SIM goes dead",
        run: () => onGoTab("upi"),
      });
    if (vault.contacts.length > 0 && unnotified > 0)
      actions.push({
        icon: <MessageSquareText size={15} />,
        label: "Notify remaining contacts",
        detail: `${unnotified} of ${vault.contacts.length} not messaged yet`,
        run: () => onGoTab("broadcast"),
      });
    if (nextMilestone)
      actions.push({
        icon: <Clock3 size={15} />,
        label: `${nextMilestone.code} · ${nextMilestone.title}`,
        detail: nextMilestone.daysLabel,
        run: () => onGoTab("plan"),
      });
  }

  return (
    <div className="space-y-5">
      <AnimatePresence>
        {(urgency === "critical" || urgency === "missed") && exposure !== 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-flare-500/30 bg-flare-500/10 px-4 py-3"
          >
            <AlertOctagon size={18} className="shrink-0 text-flare-400" />
            <p className="flex-1 text-sm font-medium text-paper">
              {urgency === "missed" ? (
                <>
                  The recycle window has passed. Anything still on <b className="font-mono">{fmtPhone(vault.phone)}</b> is exposed to its next owner.
                </>
              ) : (
                <>
                  <b className="font-mono text-flare-300">{daysLeft} days</b> until this number can be recycled —{" "}
                  <b>{pendingCritical.length} critical</b> service{pendingCritical.length !== 1 ? "s" : ""} still open.
                </>
              )}
            </p>
            <Button size="sm" variant="danger" onClick={() => onGoTab("checklist")} icon={<ArrowRight size={13} />}>
              Work the list
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* KPI row */}
      <div className="grid gap-5 xl:grid-cols-3">
        {/* countdown */}
        <section className="rounded-2xl border border-line bg-ink-850 p-5">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display text-sm font-semibold text-paper">
              <CalendarClock size={15} className="text-mist" /> Recycle clock
            </h2>
            <span className={cn("font-mono text-[10px] font-bold uppercase tracking-[0.18em]", urgencyTone[urgency])}>
              {urgency === "cleared" ? "all clear" : urgency === "missed" ? "window missed" : urgency}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-4">
            <CountdownRing daysLeft={daysLeft} urgency={urgency} />
            <div className="min-w-0 flex-1 space-y-3 text-sm">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-faint">Recycle deadline</p>
                <p className="mt-0.5 font-mono text-sm font-bold text-paper">{deadline}</p>
              </div>
              <div>
                <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-faint">SIM goes inactive</p>
                <input
                  type="date"
                  value={vault.simDropDate}
                  aria-label="SIM drop date"
                  onChange={(e) => e.target.value && onDropDate(e.target.value)}
                  className="w-full rounded-lg border border-line bg-ink-900/80 px-2.5 py-1.5 font-mono text-xs font-semibold text-paper outline-none focus:border-mint-500/50"
                />
              </div>
              <p className="text-[11px] leading-relaxed text-faint">Operators may re-issue the number 90 days after inactivity.</p>
            </div>
          </div>
        </section>

        {/* exposure + trend */}
        <section className="rounded-2xl border border-line bg-ink-850 p-5">
          <h2 className="font-display text-sm font-semibold text-paper">Exposure score</h2>
          <div className="mt-3 flex items-end gap-3">
            <AnimatePresence mode="popLayout">
              <motion.span
                key={exposure ?? "none"}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className={cn("font-mono text-5xl font-bold leading-none", toneText[sl.tone])}
              >
                {exposure === null ? "—" : exposure}
                <span className="text-xl">%</span>
              </motion.span>
            </AnimatePresence>
            <span className={cn("pb-1 text-sm font-semibold", toneText[sl.tone])}>{sl.text}</span>
          </div>
          <TrendSpark snapshots={vault.snapshots} className="mt-3" />
          <p className="mt-2 text-[11px] leading-relaxed text-mist">
            Weight of open accounts vs. total footprint — critical 25, high 12, medium 6, low 2.
          </p>
        </section>

        {/* donut */}
        <section className="rounded-2xl border border-line bg-ink-850 p-5">
          <h2 className="font-display text-sm font-semibold text-paper">What is still open</h2>
          <div className="mt-4">
            <RiskDonut byRisk={report.byRisk} />
          </div>
        </section>
      </div>

      {/* milestones strip */}
      <section className="rounded-2xl border border-line bg-ink-850 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 font-display text-sm font-semibold text-paper">
            <Clock3 size={15} className="text-mist" /> 90-day plan
          </h2>
          <button onClick={() => onGoTab("plan")} className="flex items-center gap-1 text-[11px] font-bold text-mint-300 hover:underline">
            Open plan <ArrowRight size={11} />
          </button>
        </div>
        <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
          {milestones.map((m) => {
            const prog = m.totalCount === 0 ? 0 : m.doneCount / m.totalCount;
            return (
              <div
                key={m.id}
                className={cn(
                  "rounded-xl border p-3.5",
                  m.complete ? "border-mint-500/25 bg-mint-500/[0.05]" : m.state === "overdue" ? "border-flare-500/25 bg-flare-500/[0.05]" : m.state === "due" ? "border-gold-400/25 bg-gold-400/[0.05]" : "border-line bg-ink-900/40",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold text-faint">{m.code} · day {m.from}</span>
                  <span className={cn("font-mono text-[10px] font-bold", m.complete ? "text-mint-300" : m.state === "overdue" ? "text-flare-300" : m.state === "due" ? "text-gold-300" : "text-faint")}>
                    {m.complete ? "complete" : m.state === "overdue" ? "overdue" : m.state === "due" ? "due" : "upcoming"}
                  </span>
                </div>
                <p className="mt-1.5 text-xs font-bold leading-snug text-paper">{m.title}</p>
                <div className="mt-2.5">
                  <Progress value={prog} tone={m.complete ? "mint" : m.state === "overdue" ? "flare" : "gold"} />
                </div>
                <p className="mt-1.5 font-mono text-[10px] text-faint">{m.doneCount}/{m.totalCount} closed</p>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.25fr_1fr]">
        {/* left: actions + watchlist */}
        <div className="space-y-5">
          <section className="rounded-2xl border border-line bg-ink-850 p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-sm font-semibold text-paper">Next best actions</h2>
              <button onClick={onReport} className="flex items-center gap-1.5 text-[11px] font-bold text-mist hover:text-mint-300">
                <FileText size={12} /> Download report
              </button>
            </div>
            {actions.length === 0 ? (
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-mint-500/25 bg-mint-500/5 px-4 py-4">
                <CheckCheck size={20} className="text-mint-400" />
                <div>
                  <p className="text-sm font-bold text-mint-300">Vault is clear.</p>
                  <p className="text-xs text-mist">Every tracked service is done or skipped — the number can go dead safely.</p>
                </div>
              </div>
            ) : (
              <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                {actions.map((a) => (
                  <button
                    key={a.label}
                    onClick={a.run}
                    className="group flex items-start gap-3 rounded-xl border border-line bg-ink-900/60 p-4 text-left transition-colors hover:border-mint-500/35 hover:bg-ink-800"
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-ink-800 text-mint-400">
                      {a.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2 text-sm font-bold text-paper">
                        {a.label}
                        <ArrowRight size={14} className="shrink-0 text-faint transition-all group-hover:translate-x-0.5 group-hover:text-mint-400" />
                      </span>
                      <span className="mt-1 block text-xs leading-relaxed text-mist">{a.detail}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>

          {pendingCritical.length > 0 && (
            <section className="rounded-2xl border border-flare-500/20 bg-ink-850 p-5">
              <h2 className="flex items-center gap-2 font-display text-sm font-semibold text-paper">
                <AlertOctagon size={15} className="text-flare-400" /> Critical watchlist
                <span className="rounded-full border border-flare-500/30 bg-flare-500/10 px-2 py-px font-mono text-[10px] font-bold text-flare-300">
                  {pendingCritical.length}
                </span>
              </h2>
              <div className="mt-3 divide-y divide-line-soft">
                {pendingCritical.map((s) => (
                  <div key={s.id} className="flex flex-wrap items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-ink-800 font-display text-sm font-bold text-flare-300">
                      {s.name[0]}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-paper">{s.name}</p>
                      <p className="text-[11px] text-faint">{s.category}</p>
                    </div>
                    {s.url && (
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-mist transition-colors hover:border-skyx-400/40 hover:text-skyx-300"
                      >
                        Open portal <ExternalLink size={11} />
                      </a>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => onMarkDone(s.id)}>
                      Mark done
                    </Button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* right: activity + categories */}
        <div className="space-y-5">
          <section className="rounded-2xl border border-line bg-ink-850 p-5">
            <h2 className="font-display text-sm font-semibold text-paper">Activity log</h2>
            <div className="mt-3 max-h-80 space-y-1 overflow-y-auto pr-1">
              {activity.length === 0 && <p className="py-6 text-center text-xs text-faint">Nothing logged yet.</p>}
              {activity.map((a) => (
                <div key={a.id} className="flex items-start gap-2.5 rounded-lg px-1.5 py-1.5">
                  <span className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md", KIND_TONE[a.kind] ?? "bg-ink-700 text-mist")}>
                    {KIND_ICON[a.kind]}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs leading-snug text-mist">{a.text}</span>
                    <span className="font-mono text-[10px] text-faint">{fmtActivityTime(a.at)}</span>
                  </span>
                </div>
              ))}
            </div>
            {vault.activity.length > activity.length && (
              <p className="mt-2 text-center font-mono text-[10px] text-faint">{vault.activity.length} entries total · included in the report</p>
            )}
          </section>

          <section className="rounded-2xl border border-line bg-ink-850 p-5">
            <h2 className="flex items-center gap-2 font-display text-sm font-semibold text-paper">
              <ListChecks size={15} className="text-mist" /> Progress by category
            </h2>
            <div className="mt-4 space-y-3">
              {report.byCategory.length === 0 ? (
                <p className="text-xs text-faint">No services tracked yet.</p>
              ) : (
                report.byCategory.map((c) => {
                  const p = c.total === 0 ? 0 : c.done / c.total;
                  return (
                    <div key={c.category}>
                      <div className="mb-1 flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-mist">{c.category}</span>
                        <span className="font-mono text-faint">
                          {c.done}/{c.total}
                        </span>
                      </div>
                      <Progress value={p} tone={p === 1 ? "mint" : "gold"} />
                    </div>
                  );
                })
              )}
            </div>
            {report.topPending.length > 0 && (
              <div className="mt-4 space-y-1.5 border-t border-line-soft pt-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-faint">Largest exposure next</p>
                {report.topPending.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-2 rounded-lg border border-line-soft bg-ink-900/50 px-2.5 py-1.5">
                    <span className="truncate text-[11px] font-semibold text-paper">{s.name}</span>
                    <RiskBadge risk={s.risk} />
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertOctagon,
  ArrowRight,
  CalendarClock,
  CheckCheck,
  ExternalLink,
  ListChecks,
  MessageSquareText,
  ScanLine,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { cn } from "../utils/cn";
import {
  daysUntilRecycle,
  fmtDateLong,
  fmtPhone,
  recycleDeadline,
  riskReport,
  scoreLabel,
  toISODate,
  urgencyOf,
} from "../lib/storage";
import type { Urgency } from "../lib/storage";
import type { Vault } from "../types";
import { Button, Progress, RiskBadge, toneText } from "./ui";

const urgencyTone: Record<Urgency, string> = {
  calm: "text-mint-300",
  warning: "text-gold-300",
  critical: "text-flare-300",
  missed: "text-flare-400",
  cleared: "text-mint-300",
};

const urgencyRing: Record<Urgency, string> = {
  calm: "#2bcf8c",
  warning: "#f5b84b",
  critical: "#f2544b",
  missed: "#ff7a6b",
  cleared: "#2bcf8c",
};

function CountdownRing({ daysLeft, urgency }: { daysLeft: number; urgency: Urgency }) {
  const R = 62;
  const C = 2 * Math.PI * R;
  const elapsed = Math.min(1, Math.max(0, (90 - daysLeft) / 90));
  return (
    <div className="relative h-40 w-40">
      <svg viewBox="0 0 150 150" className="h-full w-full -rotate-90">
        <circle cx="75" cy="75" r={R} fill="none" stroke="#1d2d26" strokeWidth="9" />
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
          style={{ filter: `drop-shadow(0 0 6px ${urgencyRing[urgency]}66)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("font-mono text-4xl font-bold leading-none", urgencyTone[urgency])}>
          {daysLeft < 0 ? 0 : daysLeft}
        </span>
        <span className="mt-1 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-faint">
          {daysLeft < 0 ? "days past" : "days left"}
        </span>
      </div>
    </div>
  );
}

export function Dashboard({
  vault,
  onDropDate,
  onScan,
  onMarkDone,
  onGoChecklist,
  onGoUpi,
  onGoBroadcast,
}: {
  vault: Vault;
  onDropDate: (iso: string) => void;
  onScan: () => void;
  onMarkDone: (id: string) => void;
  onGoChecklist: () => void;
  onGoUpi: () => void;
  onGoBroadcast: () => void;
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

  const actions: { icon: React.ReactNode; label: string; detail: string; onClick: () => void }[] = [];
  if (vault.services.length === 0) {
    actions.push({
      icon: <ScanLine size={15} />,
      label: "Run the Smart Scan",
      detail: "Build your baseline from the Indian service catalog",
      onClick: onScan,
    });
  } else {
    if (pendingCritical.length > 0)
      actions.push({
        icon: <ListChecks size={15} />,
        label: `Close ${pendingCritical[0].name}`,
        detail: `${pendingCritical.length} critical service${pendingCritical.length > 1 ? "s" : ""} still open`,
        onClick: onGoChecklist,
      });
    if (pendingUpi.length > 0)
      actions.push({
        icon: <ShieldCheck size={15} />,
        label: "Run the UPI safety protocol",
        detail: "Migrate or retire VPA IDs before the SIM goes dead",
        onClick: onGoUpi,
      });
    if (vault.contacts.length > 0 && unnotified > 0)
      actions.push({
        icon: <MessageSquareText size={15} />,
        label: "Notify remaining contacts",
        detail: `${unnotified} of ${vault.contacts.length} not messaged yet`,
        onClick: onGoBroadcast,
      });
  }

  return (
    <div className="space-y-5">
      {/* urgent banner */}
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
                <>The recycle window has passed. Any service still on <b className="font-mono">{fmtPhone(vault.phone)}</b> is exposed to its next owner.</>
              ) : (
                <>
                  <b className="font-mono text-flare-300">{daysLeft} days</b> until this number can be recycled —{" "}
                  <b>{pendingCritical.length} critical</b> service{pendingCritical.length !== 1 ? "s" : ""} still open.
                </>
              )}
            </p>
            <Button size="sm" variant="danger" onClick={onGoChecklist} icon={<ArrowRight size={13} />}>
              Work the list
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

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
          <div className="mt-3 flex items-center gap-5">
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
                  max={toISODate(new Date(Date.now() + 90 * 86400000))}
                  onChange={(e) => e.target.value && onDropDate(e.target.value)}
                  className="w-full rounded-lg border border-line bg-ink-900/80 px-2.5 py-1.5 font-mono text-xs font-semibold text-paper outline-none focus:border-mint-500/50"
                />
              </div>
              <p className="text-[11px] leading-relaxed text-faint">
                Operators may re-issue the number 90 days after inactivity.
              </p>
            </div>
          </div>
        </section>

        {/* exposure */}
        <section className="rounded-2xl border border-line bg-ink-850 p-5">
          <h2 className="flex items-center gap-2 font-display text-sm font-semibold text-paper">
            <TriangleAlert size={15} className="text-mist" /> Exposure score
          </h2>
          <div className="mt-4 flex items-end gap-3">
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
          <p className="mt-3 text-xs leading-relaxed text-mist">
            {exposure === null
              ? "Run a scan or add services to compute how much of your digital life is still bound to this number."
              : "Weight of still-open accounts vs. your total footprint. Critical accounts count 25, high 12, medium 6, low 2."}
          </p>
          <div className="mt-4 space-y-2">
            {report.topPending.length === 0 ? (
              <p className="flex items-center gap-2 rounded-lg border border-mint-500/20 bg-mint-500/5 px-3 py-2.5 text-xs font-semibold text-mint-300">
                <CheckCheck size={14} /> Nothing critical left open.
              </p>
            ) : (
              report.topPending.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-2 rounded-lg border border-line-soft bg-ink-900/50 px-3 py-2">
                  <span className="truncate text-xs font-semibold text-paper">{s.name}</span>
                  <RiskBadge risk={s.risk} />
                </div>
              ))
            )}
          </div>
        </section>

        {/* progress by category */}
        <section className="rounded-2xl border border-line bg-ink-850 p-5">
          <h2 className="flex items-center gap-2 font-display text-sm font-semibold text-paper">
            <ListChecks size={15} className="text-mist" /> Migration progress
          </h2>
          <div className="mt-4 flex items-center justify-between">
            <span className="font-mono text-2xl font-bold text-paper">
              {report.doneCount}
              <span className="text-sm text-faint">/{report.totalCount}</span>
            </span>
            <span className="text-[11px] font-semibold text-mist">
              {report.skippedCount > 0 && <span className="text-faint">{report.skippedCount} skipped · </span>}
              {report.pendingCount} open
            </span>
          </div>
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
        </section>
      </div>

      {/* next actions */}
      <section className="rounded-2xl border border-line bg-ink-850 p-5">
        <h2 className="font-display text-sm font-semibold text-paper">Next best actions</h2>
        {actions.length === 0 ? (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-mint-500/25 bg-mint-500/5 px-4 py-4">
            <CheckCheck size={20} className="text-mint-400" />
            <div>
              <p className="text-sm font-bold text-mint-300">Vault is clear.</p>
              <p className="text-xs text-mist">Every tracked service is done or skipped — the number can go dead safely.</p>
            </div>
          </div>
        ) : (
          <div className="mt-4 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
            {actions.map((a) => (
              <button
                key={a.label}
                onClick={a.onClick}
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

      {/* critical watchlist */}
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
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-mist transition-colors hover:border-skyx-400/40 hover:text-skyx-300"
                >
                  Open portal <ExternalLink size={11} />
                </a>
                <Button size="sm" variant="ghost" onClick={() => onMarkDone(s.id)}>
                  Mark done
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

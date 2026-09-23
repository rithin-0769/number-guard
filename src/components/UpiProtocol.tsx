import { motion } from "framer-motion";
import { AlertTriangle, Check, CheckCheck, ExternalLink, Info, ScanLine, ShieldCheck } from "lucide-react";
import { cn } from "../utils/cn";
import { VPA_PROTOCOL } from "../data/services";
import { daysUntilRecycle } from "../lib/storage";
import type { TaskStatus, Vault } from "../types";
import { Button, EmptyState, RiskBadge, StatusPill } from "./ui";

export function UpiProtocol({
  vault,
  onToggleVpa,
  onToggleStep,
  onStatus,
  onOpenScan,
}: {
  vault: Vault;
  onToggleVpa: (id: string) => void;
  onToggleStep: (serviceId: string, idx: number) => void;
  onStatus: (id: string, status: TaskStatus) => void;
  onOpenScan: () => void;
}) {
  const upiServices = vault.services.filter((s) => s.isUpi);
  const pendingUpi = upiServices.filter((s) => s.status !== "done" && s.status !== "skipped");
  const daysLeft = daysUntilRecycle(vault.simDropDate);
  const urgent = daysLeft <= 14 && pendingUpi.length > 0;
  const vpaDone = vault.vpaDone ?? [];
  const vpaComplete = vpaDone.length === VPA_PROTOCOL.length;

  return (
    <div className="space-y-6">
      {/* explainer */}
      <div className="flex flex-wrap items-start gap-4 rounded-2xl border border-line bg-ink-850 p-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-skyx-400/30 bg-skyx-400/10 text-skyx-300">
          <ShieldCheck size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-base font-bold text-paper">UPI Safety Protocol</h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-mist">
            UPI IDs travel with the number, not the person. A recycled SIM can keep receiving UPI OTPs — and in a
            takeover, money can leave before the bank notices. Work the global VPA checklist first, then clear each UPI
            app. <b className="text-paper">Only drop the SIM when everything below is done.</b>
          </p>
        </div>
        <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl border border-line bg-ink-900">
          <span className={cn("font-mono text-xl font-bold leading-none", urgent ? "text-flare-300" : "text-mint-300")}>
            {daysLeft < 0 ? 0 : daysLeft}
          </span>
          <span className="mt-1 font-mono text-[9px] uppercase tracking-widest text-faint">days</span>
        </div>
      </div>

      {/* urgent banner */}
      {urgent && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-xl border border-flare-500/30 bg-flare-500/10 px-4 py-3"
        >
          <AlertTriangle size={17} className="shrink-0 text-flare-400" />
          <p className="text-sm font-semibold text-paper">
            {daysLeft < 0
              ? "The recycle window has passed and UPI accounts are still open."
              : `Recycle window closes in ${daysLeft} days — ${pendingUpi.length} UPI app${pendingUpi.length > 1 ? "s" : ""} not cleared.`}
          </p>
        </motion.div>
      )}

      {/* global VPA protocol */}
      <section className="rounded-2xl border border-line bg-ink-850 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-sm font-semibold text-paper">
            1 · Global VPA migration
            <span className="ml-2 font-mono text-[11px] font-medium text-faint">
              {vpaDone.length}/{VPA_PROTOCOL.length}
            </span>
          </h3>
          {vpaComplete && (
            <span className="flex items-center gap-1.5 rounded-full border border-mint-500/30 bg-mint-500/10 px-2.5 py-1 text-[11px] font-bold text-mint-300">
              <CheckCheck size={12} /> Protocol complete
            </span>
          )}
        </div>
        <div className="mt-4 space-y-1.5">
          {VPA_PROTOCOL.map((step, i) => {
            const done = vpaDone.includes(step.id);
            return (
              <button
                key={step.id}
                onClick={() => onToggleVpa(step.id)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
                  done ? "border-mint-500/20 bg-mint-500/5" : "border-line bg-ink-900/50 hover:border-ink-600",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border font-mono text-[10px] font-bold transition-colors",
                    done ? "border-mint-500 bg-mint-500 text-ink-950" : "border-ink-600 text-faint",
                  )}
                >
                  {done ? <Check size={12} strokeWidth={3.5} /> : i + 1}
                </span>
                <span className="min-w-0">
                  <span className={cn("block text-sm font-bold", done ? "text-mist line-through" : "text-paper")}>
                    {step.title}
                  </span>
                  <span className={cn("mt-0.5 block text-xs leading-relaxed", done ? "text-faint" : "text-mist")}>
                    {step.detail}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* per-app protocols */}
      <section>
        <h3 className="mb-3 px-1 font-display text-sm font-semibold text-paper">2 · App-by-app clearance</h3>
        {upiServices.length === 0 ? (
          <EmptyState
            icon={<ScanLine size={20} />}
            title="No UPI apps tracked yet"
            body="Run the Smart Scan to add GPay, PhonePe, Paytm and BHIM to your vault, then clear them here."
            action={
              <Button onClick={onOpenScan} icon={<ScanLine size={15} />}>
                Run smart scan
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {upiServices.map((s) => {
              const stepsDone = s.stepDone.filter(Boolean).length;
              const closed = s.status === "done";
              return (
                <div
                  key={s.id}
                  className={cn(
                    "rounded-2xl border p-5 transition-colors",
                    closed ? "border-mint-500/25 bg-mint-500/[0.04]" : "border-line bg-ink-850",
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-lg border font-display text-sm font-bold",
                        closed ? "border-mint-500/30 bg-mint-500/10 text-mint-300" : "border-skyx-400/30 bg-skyx-400/10 text-skyx-300",
                      )}
                    >
                      {s.name[0]}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-sm font-bold text-paper">{s.name}</p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <StatusPill status={s.status} />
                        <RiskBadge risk={s.risk} />
                      </div>
                    </div>
                    {s.url && (
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-[11px] font-bold text-mist transition-colors hover:border-skyx-400/40 hover:text-skyx-300"
                      >
                        Open <ExternalLink size={11} />
                      </a>
                    )}
                  </div>

                  <div className="mt-4 space-y-1">
                    {s.steps.map((st, i) => (
                      <button
                        key={i}
                        onClick={() => onToggleStep(s.id, i)}
                        className="flex w-full items-start gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-ink-800"
                      >
                        <span
                          className={cn(
                            "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                            s.stepDone[i] ? "border-mint-500 bg-mint-500 text-ink-950" : "border-ink-600 bg-ink-900",
                          )}
                        >
                          {s.stepDone[i] && <Check size={11} strokeWidth={3.5} />}
                        </span>
                        <span className={cn("text-xs leading-relaxed", s.stepDone[i] ? "text-faint line-through" : "text-mist")}>
                          {st}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-line-soft pt-3">
                    <span className="font-mono text-[11px] text-faint">
                      {stepsDone}/{s.steps.length} steps
                    </span>
                    <Button
                      size="sm"
                      variant={closed ? "outline" : "primary"}
                      onClick={() => onStatus(s.id, closed ? "pending" : "done")}
                    >
                      {closed ? "Reopen" : "Mark cleared"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <p className="flex items-start gap-2 rounded-xl border border-line-soft bg-ink-900/50 px-4 py-3 text-xs leading-relaxed text-faint">
        <Info size={14} className="mt-0.5 shrink-0 text-skyx-400" />
        Heads up: changing the mobile number in a UPI app verifies with an OTP on the new SIM — keep the new SIM active
        while you work this tab. This tab is a tracking aid, not a live audit of your UPI IDs.
      </p>
    </div>
  );
}

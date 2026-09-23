import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CalendarClock, Check, Lock, Phone, Radar, ScanLine, ShieldCheck, Sparkles, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "../utils/cn";
import { CATALOG } from "../data/services";
import { fmtPhone, isValidIndianMobile, normalizePhone, toISODate } from "../lib/storage";
import type { Category } from "../types";
import { Button, inputCls } from "./ui";

export interface VaultMeta {
  phone: string;
  serviceCount: number;
  doneCount: number;
  daysLeft: number;
}

const PROFILE_CATS: Category[] = ["Identity", "Banking", "UPI", "Government", "Social", "Shopping", "Travel", "Lifestyle"];

export function SetupWizard({
  vaults,
  onOpen,
  onCreate,
  onScanOnly,
}: {
  vaults: VaultMeta[];
  onOpen: (phone: string) => void;
  onCreate: (phone: string, newNumber: string | undefined, simDropDate: string, cats: Category[]) => void;
  onScanOnly: () => void;
}) {
  const [step, setStep] = useState(0);
  const [oldRaw, setOldRaw] = useState("");
  const [newRaw, setNewRaw] = useState("");
  const [dropDate, setDropDate] = useState(toISODate(new Date()));
  const [cats, setCats] = useState<Category[]>([...PROFILE_CATS]);

  const old = normalizePhone(oldRaw);
  const newP = normalizePhone(newRaw);
  const oldOk = isValidIndianMobile(old);
  const newOk = newRaw === "" || isValidIndianMobile(newP);
  const existing = useMemo(() => vaults.find((v) => v.phone === old), [vaults, old]);
  const catalogCount = CATALOG.filter((c) => cats.includes(c.category)).length;

  const finish = () => {
    if (!oldOk) return;
    onCreate(old, isValidIndianMobile(newP) ? newP : undefined, dropDate, cats);
  };

  const steps = ["Your number", "What you use", "Scan & launch"];

  return (
    <div className="console-grid min-h-screen bg-ink-950">
      <header className="flex items-center justify-between border-b border-line-soft px-5 py-4 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-mint-500 text-ink-950 shadow-[0_0_28px_color-mix(in_srgb,var(--color-mint-500)_45%,transparent)]">
            <ShieldCheck size={20} strokeWidth={2.4} />
          </div>
          <div>
            <p className="font-display text-base font-bold leading-none tracking-tight text-paper">NumberGuard</p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-faint">SIM recycle risk console</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-2 rounded-full border border-line bg-ink-850 px-3 py-1.5 text-[11px] font-semibold text-mist sm:flex">
            <Lock size={12} className="text-mint-400" /> Local-only · zero servers
          </span>
          {vaults.length > 0 && (
            <Button size="sm" variant="outline" onClick={onScanOnly}>
              Skip to existing vault
            </Button>
          )}
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-5xl gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-start lg:py-14">
        {/* pitch */}
        <div className="lg:sticky lg:top-14">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-mint-400">The 90-day rule</p>
          <h1 className="mt-3 font-display text-4xl font-bold leading-[1.06] tracking-tight text-paper sm:text-[2.9rem]">
            Your number dies after <span className="text-mint-400">90 days</span> of silence. Your accounts shouldn't.
          </h1>
          <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-mist">
            Telecom operators recycle idle Indian mobile numbers. Whatever is still bound to yours — bank OTPs, UPI IDs,
            Aadhaar, WhatsApp — passes to the next owner. NumberGuard turns the swap into a deadline-bound, auditable
            checklist.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {[
              { icon: <ScanLine size={16} />, t: "Scan & track", d: "~30 Indian services, step by step" },
              { icon: <CalendarClock size={16} />, t: "90-day plan", d: "Milestones with due dates" },
              { icon: <Users size={16} />, t: "Notify contacts", d: "Grouped WhatsApp blasts" },
              { icon: <Sparkles size={16} />, t: "Proof of work", d: "Markdown report with timestamps" },
            ].map((s, i) => (
              <motion.div
                key={s.t}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 + i * 0.06 }}
                className="rounded-xl border border-line bg-ink-850/80 p-4"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-ink-800 text-mint-400">
                  {s.icon}
                </div>
                <p className="mt-3 font-display text-sm font-semibold text-paper">{s.t}</p>
                <p className="mt-1 text-xs leading-relaxed text-mist">{s.d}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* wizard */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-line bg-ink-850 p-6 shadow-[0_40px_90px_-30px_rgba(0,0,0,0.55)]"
        >
          {/* stepper */}
          <div className="flex items-center gap-2">
            {steps.map((s, i) => (
              <div key={s} className="flex flex-1 items-center gap-2">
                <button
                  onClick={() => (i < step ? setStep(i) : undefined)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] font-bold transition-colors",
                    i === step ? "bg-mint-500/10 text-mint-300" : i < step ? "text-mist hover:text-paper" : "text-faint",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full font-mono text-[10px]",
                      i === step
                        ? "bg-mint-500 text-ink-950"
                        : i < step
                          ? "border border-mint-500/40 text-mint-400"
                          : "border border-line text-faint",
                    )}
                  >
                    {i < step ? <Check size={11} strokeWidth={3.5} /> : i + 1}
                  </span>
                  <span className="hidden sm:inline">{s}</span>
                </button>
                {i < steps.length - 1 && <span className="h-px flex-1 bg-line" />}
              </div>
            ))}
          </div>

          <div className="mt-6 min-h-72">
            <AnimatePresence mode="wait">
              {/* ---------- step 1 ---------- */}
              {step === 0 && (
                <motion.div key="s0" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="space-y-5">
                  <div>
                    <h2 className="font-display text-lg font-semibold text-paper">Which number are you dropping?</h2>
                    <p className="mt-1 text-xs text-mist">This is the SIM that will be deactivated. It becomes your vault's key.</p>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-mist">Old number</span>
                    <div className="flex items-stretch gap-2">
                      <span className="flex items-center rounded-lg border border-line bg-ink-900 px-3 font-mono text-sm font-semibold text-mint-400">
                        +91
                      </span>
                      <input
                        className={`${inputCls} font-mono tracking-wider`}
                        placeholder="98XXXXXXXX"
                        inputMode="numeric"
                        maxLength={14}
                        value={oldRaw}
                        autoFocus
                        onChange={(e) => setOldRaw(e.target.value.replace(/[^\d\s+]/g, ""))}
                      />
                    </div>
                    <p className={cn("text-[11px] font-medium", oldRaw && !oldOk ? "text-flare-300" : oldOk ? "text-mint-300" : "text-faint")}>
                      {oldRaw === "" ? "10-digit Indian mobile, starting 6–9" : oldOk ? "Valid mobile number" : "Not a valid Indian mobile number"}
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-mist">
                        New number <span className="font-mono text-[10px] normal-case text-faint">optional</span>
                      </span>
                      <input
                        className={`${inputCls} font-mono tracking-wider ${!newOk ? "border-flare-500/50" : ""}`}
                        placeholder="97XXXXXXXX"
                        inputMode="numeric"
                        maxLength={14}
                        value={newRaw}
                        onChange={(e) => setNewRaw(e.target.value.replace(/[^\d\s+]/g, ""))}
                      />
                      {!newOk && <p className="text-[11px] font-medium text-flare-300">Not a valid Indian mobile</p>}
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-mist">SIM goes inactive on</span>
                      <input
                        type="date"
                        className={`${inputCls} font-mono`}
                        value={dropDate}
                        onChange={(e) => e.target.value && setDropDate(e.target.value)}
                      />
                      <p className="text-[11px] text-faint">Recycle deadline = this date + 90 days</p>
                    </div>
                  </div>

                  {existing && (
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-mint-500/20 bg-mint-500/5 px-3 py-2.5 text-xs">
                      <span className="text-mist">
                        A vault already exists for this number — {existing.serviceCount} services,{" "}
                        <b className="text-mint-300">{existing.doneCount} cleared</b>
                      </span>
                      <Button size="sm" variant="outline" onClick={() => onOpen(old)}>
                        Open it instead
                      </Button>
                    </div>
                  )}

                  <Button className="w-full" disabled={!oldOk || !newOk} onClick={() => setStep(1)} icon={<ArrowRight size={15} />}>
                    Continue
                  </Button>
                </motion.div>
              )}

              {/* ---------- step 2 ---------- */}
              {step === 1 && (
                <motion.div key="s1" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="space-y-5">
                  <div>
                    <h2 className="font-display text-lg font-semibold text-paper">What is this number part of?</h2>
                    <p className="mt-1 text-xs text-mist">
                      Pick the areas that apply — the scan will pull in {" "}
                      <b className="font-mono text-mint-300">{catalogCount}</b> matching services. You can always run the scan again later.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {PROFILE_CATS.map((c) => {
                      const on = cats.includes(c);
                      const count = CATALOG.filter((x) => x.category === c).length;
                      return (
                        <button
                          key={c}
                          onClick={() => setCats((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]))}
                          className={cn(
                            "flex items-center justify-between rounded-lg border px-3 py-3 text-left text-xs font-semibold transition-colors",
                            on ? "border-mint-500/40 bg-mint-500/10 text-paper" : "border-line bg-ink-900/50 text-faint",
                          )}
                        >
                          <span className="flex items-center gap-2">
                            <span className={cn("flex h-4 w-4 items-center justify-center rounded border", on ? "border-mint-500 bg-mint-500 text-ink-950" : "border-ink-600")}>
                              {on && <Check size={10} strokeWidth={3.5} />}
                            </span>
                            {c}
                          </span>
                          <span className="font-mono text-[10px] text-faint">{count}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setStep(0)} icon={<ArrowLeft size={15} />}>
                      Back
                    </Button>
                    <Button className="flex-1" onClick={() => setStep(2)} icon={<ArrowRight size={15} />}>
                      Continue
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* ---------- step 3 ---------- */}
              {step === 2 && (
                <motion.div key="s2" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="space-y-5">
                  <div>
                    <h2 className="font-display text-lg font-semibold text-paper">Ready to launch</h2>
                    <p className="mt-1 text-xs text-mist">Here is what the vault will hold. The scan runs on creation.</p>
                  </div>
                  <div className="space-y-2 rounded-xl border border-line bg-ink-900/50 p-4">
                    {[
                      { l: "Old number", v: fmtPhone(old), icon: <Phone size={13} /> },
                      { l: "New number", v: isValidIndianMobile(newP) ? fmtPhone(newP) : "added later", icon: <Phone size={13} /> },
                      { l: "SIM drop date", v: new Date(`${dropDate}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }), icon: <CalendarClock size={13} /> },
                      { l: "Services to scan", v: `${catalogCount} across ${cats.length} categories`, icon: <Radar size={13} /> },
                    ].map((r) => (
                      <div key={r.l} className="flex items-center justify-between gap-3 text-xs">
                        <span className="flex items-center gap-2 font-semibold text-mist">
                          <span className="text-mint-400">{r.icon}</span>
                          {r.l}
                        </span>
                        <span className="font-mono text-paper">{r.v}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setStep(1)} icon={<ArrowLeft size={15} />}>
                      Back
                    </Button>
                    <Button className="flex-1" onClick={finish} disabled={!oldOk} icon={<Radar size={15} />}>
                      Create vault & scan
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {vaults.length > 0 && (
            <div className="mt-6 border-t border-line-soft pt-4">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-faint">Vaults on this device</p>
              <div className="flex flex-wrap gap-1.5">
                {vaults.map((v) => (
                  <button
                    key={v.phone}
                    onClick={() => onOpen(v.phone)}
                    className="flex items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-[11px] font-semibold text-mist transition-colors hover:border-mint-500/40 hover:text-mint-300"
                  >
                    <span className="font-mono tracking-wider">{fmtPhone(v.phone)}</span>
                    <span className="text-faint">
                      {v.doneCount}/{v.serviceCount}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}

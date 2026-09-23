import { motion } from "framer-motion";
import { ArrowRight, KeyRound, Lock, MessageSquareWarning, PhoneOff, ShieldCheck, UserMinus } from "lucide-react";
import { useMemo, useState } from "react";
import { fmtPhone, isValidIndianMobile, normalizePhone } from "../lib/storage";
import { Button, inputCls } from "./ui";

export interface VaultMeta {
  phone: string;
  serviceCount: number;
  doneCount: number;
  daysLeft: number;
}

export function VaultGate({
  vaults,
  onOpen,
  onCreate,
}: {
  vaults: VaultMeta[];
  onOpen: (phone: string) => void;
  onCreate: (phone: string, newNumber?: string) => void;
}) {
  const [oldRaw, setOldRaw] = useState("");
  const [newRaw, setNewRaw] = useState("");
  const old = normalizePhone(oldRaw);
  const isNew = isValidIndianMobile(old);
  const existing = useMemo(() => vaults.find((v) => v.phone === old), [vaults, old]);
  const newOk = newRaw === "" || isValidIndianMobile(normalizePhone(newRaw));

  const submit = () => {
    if (!isNew) return;
    const nn = normalizePhone(newRaw);
    if (existing) onOpen(old);
    else onCreate(old, isValidIndianMobile(nn) ? nn : undefined);
  };

  return (
    <div className="console-grid min-h-screen bg-ink-950">
      {/* top bar */}
      <header className="flex items-center justify-between border-b border-line-soft px-5 py-4 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-mint-500 text-ink-950 shadow-[0_0_28px_rgba(43,207,140,0.45)]">
            <ShieldCheck size={20} strokeWidth={2.4} />
          </div>
          <div>
            <p className="font-display text-base font-bold leading-none tracking-tight text-paper">NumberGuard</p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-faint">SIM recycle risk console</p>
          </div>
        </div>
        <span className="hidden items-center gap-2 rounded-full border border-line bg-ink-850 px-3 py-1.5 text-[11px] font-semibold text-mist sm:flex">
          <Lock size={12} className="text-mint-400" />
          Local-only · zero servers
        </span>
      </header>

      <main className="mx-auto grid w-full max-w-5xl gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-16">
        {/* explainer */}
        <div>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-mint-400"
          >
            The 90-day rule
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mt-3 font-display text-4xl font-bold leading-[1.08] tracking-tight text-paper sm:text-5xl"
          >
            Is your phone number a <span className="text-mint-400">security hole?</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-4 max-w-lg text-[15px] leading-relaxed text-mist"
          >
            Telecom operators recycle idle Indian mobile numbers. Whatever is still bound to yours — bank OTPs, UPI IDs,
            Aadhaar, WhatsApp — passes to the next owner. NumberGuard turns the swap into a deadline-bound checklist. India recycles numbers in as little as 90 days.
          </motion.p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              { icon: <PhoneOff size={16} />, t: "Number deactivated", d: "You stop recharging your old Indian mobile number" },
              { icon: <UserMinus size={16} />, t: "Stranger gets SIM", d: "The carrier re-issues your number to a new customer" },
              { icon: <MessageSquareWarning size={16} />, t: "They receive OTPs", d: "Your bank login text codes go straight to their phone" },
            ].map((s, i) => (
              <motion.div
                key={s.t}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.07 }}
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

        {/* input card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="rounded-2xl border border-line bg-ink-850 p-6 shadow-[0_40px_90px_-30px_rgba(0,0,0,0.9)]"
        >
          <h2 className="font-display text-lg font-semibold text-paper">Open or create your vault</h2>
          <p className="mt-1 text-xs text-mist">A vault is a private, on-device checklist keyed to one mobile number.</p>

          <form
            className="mt-5 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-mist">Old number · the one leaving</span>
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
                  onChange={(e) => setOldRaw(e.target.value.replace(/[^\d\s+]/g, ""))}
                  autoFocus
                />
              </div>
              <p
                className={`text-[11px] font-medium ${
                  oldRaw && !isNew ? "text-flare-300" : old ? "text-mint-300" : "text-faint"
                }`}
              >
                {oldRaw === ""
                  ? "10-digit Indian mobile, starting 6–9"
                  : isNew
                    ? "Valid mobile number"
                    : "Not a valid Indian mobile number"}
              </p>
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-mist">
                New number <span className="font-mono text-[10px] normal-case text-faint">optional</span>
              </span>
              <div className="flex items-stretch gap-2">
                <span className="flex items-center rounded-lg border border-line bg-ink-900 px-3 font-mono text-sm font-semibold text-mist">
                  +91
                </span>
                <input
                  className={`${inputCls} font-mono tracking-wider ${!newOk ? "border-flare-500/50" : ""}`}
                  placeholder="97XXXXXXXX"
                  inputMode="numeric"
                  maxLength={14}
                  value={newRaw}
                  onChange={(e) => setNewRaw(e.target.value.replace(/[^\d\s+]/g, ""))}
                />
              </div>
              {!newOk && <p className="text-[11px] font-medium text-flare-300">Not a valid Indian mobile number</p>}
            </div>

            <Button type="submit" disabled={!isNew} className="w-full" icon={<ArrowRight size={16} />}>
              {existing ? `Open vault · ${fmtPhone(existing.phone)}` : "Create vault & start scanning"}
            </Button>

            {existing && (
              <div className="flex items-center justify-between rounded-lg border border-mint-500/20 bg-mint-500/5 px-3 py-2.5 text-xs">
                <span className="text-mist">
                  Vault found — <b className="text-paper">{existing.serviceCount}</b> services,{" "}
                  <b className="text-mint-300">{existing.doneCount}</b> cleared
                </span>
                <span className="font-mono text-[11px] text-gold-300">{existing.daysLeft}d to recycle</span>
              </div>
            )}
          </form>

          {vaults.length > 0 && (
            <div className="mt-6 border-t border-line-soft pt-4">
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-faint">
                <KeyRound size={12} /> Vaults on this device
              </p>
              <div className="flex flex-col gap-1.5">
                {vaults.map((v) => (
                  <button
                    key={v.phone}
                    onClick={() => onOpen(v.phone)}
                    className="group flex items-center justify-between rounded-lg border border-transparent px-3 py-2 text-left transition-colors hover:border-line hover:bg-ink-800"
                  >
                    <span className="font-mono text-sm font-semibold tracking-wider text-paper group-hover:text-mint-300">
                      {fmtPhone(v.phone)}
                    </span>
                    <span className="text-[11px] text-faint">
                      {v.doneCount}/{v.serviceCount} cleared
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

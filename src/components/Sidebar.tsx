import { Download, FileJson, FileText, Lock, Moon, PhoneCall, Plus, ShieldCheck, Sun, Trash2, Upload } from "lucide-react";
import { useRef } from "react";
import { cn } from "../utils/cn";
import { daysUntilRecycle, fmtPhone, scoreLabel } from "../lib/storage";
import type { Theme, Vault } from "../types";
import type { VaultMeta } from "./SetupWizard";
import { Progress, toneText } from "./ui";

export function Sidebar({
  vault,
  vaults,
  exposure,
  theme,
  onToggleTheme,
  onSelect,
  onNew,
  onDeleteVault,
  onExport,
  onImport,
  onReport,
  onIncident,
  onOpenSpec,
}: {
  vault: Vault;
  vaults: VaultMeta[];
  exposure: number | null;
  theme: Theme;
  onToggleTheme: () => void;
  onSelect: (phone: string) => void;
  onNew: () => void;
  onDeleteVault: (phone: string) => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onReport: () => void;
  onIncident: () => void;
  onOpenSpec: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const daysLeft = daysUntilRecycle(vault.simDropDate);
  const done = vault.services.filter((s) => s.status === "done" || s.status === "skipped").length;
  const total = vault.services.length;
  const sl = scoreLabel(exposure);
  const incidentOpen = vault.incident.active && vault.incident.done.length < 6;

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
      {/* brand */}
      <div className="flex items-center gap-3 px-1 pt-1">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-mint-500 text-ink-950">
          <ShieldCheck size={19} strokeWidth={2.4} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-[15px] font-bold leading-none tracking-tight text-paper">NumberGuard</p>
          <p className="mt-1 truncate font-mono text-[9.5px] uppercase tracking-[0.2em] text-faint">Risk console · v3</p>
        </div>
        <button
          onClick={onToggleTheme}
          aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          title="Toggle theme (T)"
          className="rounded-lg border border-line p-1.5 text-mist transition-colors hover:border-mint-500/40 hover:text-mint-300"
        >
          {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </div>

      {/* incident alert */}
      {incidentOpen && (
        <button
          onClick={onIncident}
          className="flex items-start gap-2.5 rounded-xl border border-flare-500/35 bg-flare-500/10 px-3.5 py-3 text-left transition-colors hover:bg-flare-500/15"
        >
          <PhoneCall size={15} className="mt-0.5 shrink-0 text-flare-400" />
          <span>
            <span className="block text-xs font-bold text-paper">Incident lane open</span>
            <span className="mt-0.5 block text-[11px] leading-snug text-mist">
              {vault.incident.done.length}/6 emergency steps done — finish this first.
            </span>
          </span>
        </button>
      )}

      {/* active vault */}
      <div className="rounded-xl border border-line bg-ink-850 p-3.5">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-faint">Active vault</p>
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              exposure === 0 ? "bg-mint-400" : daysLeft <= 14 ? "bg-flare-500 pulse-dot" : "bg-mint-500/50",
            )}
          />
        </div>
        <p className="mt-2 font-mono text-lg font-bold tracking-wider text-paper">{fmtPhone(vault.phone)}</p>
        <div className="mt-3">
          <div className="mb-1.5 flex items-center justify-between text-[11px]">
            <span className="text-mist">
              {done}/{total} closed
            </span>
            <span className={cn("font-mono font-semibold", exposure === null ? "text-faint" : toneText[sl.tone])}>
              {exposure === null ? "—" : `${exposure}%`}
            </span>
          </div>
          <Progress value={total === 0 ? 0 : done / total} tone="mint" />
        </div>
        <div className="mt-3 flex items-center justify-between font-mono text-[10px] text-faint">
          <span>{daysLeft < 0 ? "window missed" : `${daysLeft}d to recycle`}</span>
          <span>{vault.activity.length} log entries</span>
        </div>
        {vault.newNumber && (
          <p className="mt-3 truncate rounded-lg border border-line-soft bg-ink-900/60 px-2.5 py-1.5 font-mono text-[11px] text-mist">
            → new: <span className="text-skyx-300">{fmtPhone(vault.newNumber)}</span>
          </p>
        )}
      </div>

      {/* vault list */}
      <div>
        <div className="mb-2 flex items-center justify-between px-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-faint">All vaults</p>
          <button
            onClick={onNew}
            className="flex items-center gap-1 rounded-md border border-line px-2 py-1 text-[10px] font-bold text-mist transition-colors hover:border-mint-500/40 hover:text-mint-300"
          >
            <Plus size={11} /> New
          </button>
        </div>
        <div className="flex flex-col gap-1">
          {vaults.map((v) => (
            <div
              key={v.phone}
              className={cn(
                "group flex items-center justify-between rounded-lg border px-3 py-2 transition-colors",
                v.phone === vault.phone
                  ? "border-mint-500/30 bg-mint-500/5"
                  : "border-transparent hover:border-line hover:bg-ink-800",
              )}
            >
              <button onClick={() => onSelect(v.phone)} className="flex min-w-0 flex-1 items-center justify-between gap-2 text-left">
                <span className={cn("truncate font-mono text-xs font-semibold tracking-wider", v.phone === vault.phone ? "text-mint-300" : "text-paper")}>
                  {fmtPhone(v.phone)}
                </span>
                <span className="shrink-0 text-[10px] text-faint">
                  {v.doneCount}/{v.serviceCount}
                </span>
              </button>
              {v.phone !== vault.phone && (
                <button
                  onClick={() => onDeleteVault(v.phone)}
                  className="shrink-0 p-1 text-faint opacity-0 transition-all hover:text-flare-400 group-hover:opacity-100"
                  title="Delete vault"
                  aria-label={`Delete vault ${v.phone}`}
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}
          {vaults.length === 0 && <p className="px-1 text-xs text-faint">No vaults yet.</p>}
        </div>
      </div>

      <div className="flex-1" />

      {/* quick actions */}
      <div className="space-y-1.5">
        <p className="px-1 text-[10px] font-bold uppercase tracking-[0.18em] text-faint">Actions</p>
        <button
          onClick={onIncident}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold text-mist transition-colors hover:bg-flare-500/10 hover:text-flare-300"
        >
          <PhoneCall size={14} className="text-flare-400" /> Incident lane (lost SIM)
        </button>
        <button
          onClick={onReport}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold text-mist transition-colors hover:bg-ink-800 hover:text-paper"
        >
          <FileText size={14} className="text-mint-400" /> Download status report (.md)
        </button>
      </div>

      {/* data controls */}
      <div className="space-y-1.5 border-t border-line-soft pt-3.5">
        <p className="px-1 text-[10px] font-bold uppercase tracking-[0.18em] text-faint">Local data</p>
        <button
          onClick={onExport}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold text-mist transition-colors hover:bg-ink-800 hover:text-paper"
        >
          <Download size={14} className="text-mint-400" /> Export vault JSON
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold text-mist transition-colors hover:bg-ink-800 hover:text-paper"
        >
          <Upload size={14} className="text-skyx-400" /> Import vault JSON
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onImport(f);
            e.target.value = "";
          }}
        />
        <button
          onClick={onToggleTheme}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold text-mist transition-colors hover:bg-ink-800 hover:text-paper"
        >
          {theme === "dark" ? <Sun size={14} className="text-gold-400" /> : <Moon size={14} className="text-skyx-400" />}
          {theme === "dark" ? "Switch to daylight theme" : "Switch to console theme"}
        </button>
        <button
          onClick={onOpenSpec}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold text-mist transition-colors hover:bg-ink-800 hover:text-paper"
        >
          <FileJson size={14} className="text-gold-400" /> Product spec (PRD)
        </button>
        <button
          onClick={() => onDeleteVault(vault.phone)}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold text-mist transition-colors hover:bg-flare-500/10 hover:text-flare-300"
        >
          <Trash2 size={14} className="text-flare-400" /> Delete this vault
        </button>
      </div>

      <p className="flex items-center gap-1.5 px-1 text-[10px] leading-relaxed text-faint">
        <Lock size={11} className="shrink-0 text-mint-500" />
        Everything lives in this browser's localStorage. No accounts, no network.
      </p>
    </div>
  );
}

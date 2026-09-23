import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../utils/cn";
import type { RiskLevel, TaskStatus } from "../types";
import { RISK_LABEL, STATUS_LABEL } from "../types";

/* ---------------- tone maps ---------------- */

export type Tone = "mint" | "flare" | "gold" | "sky" | "none";

export const toneText: Record<Tone, string> = {
  mint: "text-mint-300",
  flare: "text-flare-300",
  gold: "text-gold-300",
  sky: "text-skyx-300",
  none: "text-mist",
};

export const toneBadge: Record<Tone, string> = {
  mint: "bg-mint-500/10 text-mint-300 border-mint-500/25",
  flare: "bg-flare-500/10 text-flare-300 border-flare-500/30",
  gold: "bg-gold-400/10 text-gold-300 border-gold-400/25",
  sky: "bg-skyx-400/10 text-skyx-300 border-skyx-400/25",
  none: "bg-ink-700/40 text-mist border-line",
};

export const toneBar: Record<Tone, string> = {
  mint: "bg-mint-500",
  flare: "bg-flare-500",
  gold: "bg-gold-400",
  sky: "bg-skyx-400",
  none: "bg-ink-600",
};

export const riskTone: Record<RiskLevel, Tone> = {
  critical: "flare",
  high: "gold",
  medium: "sky",
  low: "none",
};

/* ---------------- button ---------------- */

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "danger" | "outline" | "wa";
  size?: "sm" | "md";
  icon?: ReactNode;
}

export function Button({ variant = "primary", size = "md", icon, className, children, ...rest }: BtnProps) {
  return (
    <button
      {...rest}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-150 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40",
        size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2.5 text-sm",
        variant === "primary" &&
          "bg-mint-500 text-ink-950 shadow-[0_0_0_1px_rgba(43,207,140,0.4),0_8px_24px_-8px_rgba(43,207,140,0.5)] hover:bg-mint-400",
        variant === "ghost" && "bg-ink-700/60 text-paper hover:bg-ink-600/70",
        variant === "outline" && "border border-line bg-transparent text-mist hover:border-ink-600 hover:text-paper",
        variant === "danger" && "border border-flare-500/30 bg-flare-500/10 text-flare-300 hover:bg-flare-500/20",
        variant === "wa" && "bg-[#1f8a4c] text-white shadow-[0_8px_24px_-8px_rgba(31,138,76,0.6)] hover:bg-[#249c57]",
        className,
      )}
    >
      {icon}
      {children}
    </button>
  );
}

/* ---------------- badges & pills ---------------- */

export function RiskBadge({ risk, className }: { risk: RiskLevel; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-1.5 py-px font-mono text-[10px] font-semibold uppercase tracking-wide",
        toneBadge[riskTone[risk]],
        className,
      )}
    >
      {RISK_LABEL[risk]}
    </span>
  );
}

export function UpiBadge() {
  return (
    <span className="inline-flex items-center rounded border border-skyx-400/25 bg-skyx-400/10 px-1.5 py-px font-mono text-[10px] font-semibold uppercase tracking-wide text-skyx-300">
      UPI
    </span>
  );
}

export function StatusPill({ status }: { status: TaskStatus }) {
  const map: Record<TaskStatus, { cls: string; dot: string }> = {
    pending: { cls: "bg-gold-400/10 text-gold-300 border-gold-400/25", dot: "bg-gold-400" },
    in_progress: { cls: "bg-skyx-400/10 text-skyx-300 border-skyx-400/25", dot: "bg-skyx-400 pulse-dot" },
    done: { cls: "bg-mint-500/10 text-mint-300 border-mint-500/30", dot: "bg-mint-400" },
    skipped: { cls: "bg-ink-700/40 text-faint border-line", dot: "bg-faint" },
  };
  const m = map[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold", m.cls)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", m.dot)} />
      {STATUS_LABEL[status]}
    </span>
  );
}

/* ---------------- progress ---------------- */

export function Progress({
  value,
  tone = "mint",
  className,
  track = "bg-ink-700/70",
}: {
  value: number; // 0..1
  tone?: Tone;
  className?: string;
  track?: string;
}) {
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full", track, className)}>
      <motion.div
        className={cn("h-full rounded-full", toneBar[tone])}
        initial={false}
        animate={{ width: `${Math.min(100, Math.max(0, value * 100))}%` }}
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
      />
    </div>
  );
}

/* ---------------- form bits ---------------- */

export const inputCls =
  "w-full rounded-lg border border-line bg-ink-900/80 px-3 py-2.5 text-sm text-paper placeholder:text-faint outline-none transition-colors focus:border-mint-500/50 focus:ring-2 focus:ring-mint-500/15";

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="flex items-baseline justify-between text-[11px] font-bold uppercase tracking-[0.12em] text-mist">
        {label}
        {hint && <span className="font-mono text-[10px] normal-case tracking-normal text-faint">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

export function Seg<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { value: T; label: string; tone?: Tone }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("inline-flex rounded-lg border border-line bg-ink-900/70 p-0.5", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors",
            value === o.value ? cn("text-ink-950", toneBar[o.tone ?? "mint"]) : "text-mist hover:text-paper",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------------- modal ---------------- */

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/70 p-4 backdrop-blur-sm sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={onClose}
        >
          <motion.div
            onMouseDown={(e) => e.stopPropagation()}
            className={cn(
              "max-h-[86vh] w-full overflow-y-auto rounded-2xl border border-line bg-ink-850 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)]",
              wide ? "max-w-2xl" : "max-w-md",
            )}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-line-soft bg-ink-850/95 px-5 py-4 backdrop-blur">
              <div>
                <h3 className="font-display text-base font-semibold text-paper">{title}</h3>
                {subtitle && <p className="mt-0.5 text-xs text-mist">{subtitle}</p>}
              </div>
              <button
                onClick={onClose}
                className="rounded-md p-1.5 text-mist transition-colors hover:bg-ink-700 hover:text-paper"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
            <div className="px-5 py-4">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------------- empty state ---------------- */

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-ink-900/40 px-6 py-14 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-line bg-ink-800 text-mist">
        {icon}
      </div>
      <h3 className="font-display text-base font-semibold text-paper">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-mist">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ---------------- toasts ---------------- */

export interface Toast {
  id: string;
  msg: string;
  tone: Tone;
}

export function Toasts({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: string) => void }) {
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, x: 32, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 24, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="pointer-events-auto flex items-center gap-3 rounded-xl border border-line bg-ink-800/95 px-4 py-3 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.8)] backdrop-blur"
          >
            <span className={cn("h-2 w-2 shrink-0 rounded-full", toneBar[t.tone])} />
            <p className="flex-1 text-sm font-medium text-paper">{t.msg}</p>
            <button onClick={() => dismiss(t.id)} className="text-faint transition-colors hover:text-paper" aria-label="Dismiss">
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

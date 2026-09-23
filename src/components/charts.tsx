import { motion } from "framer-motion";
import { cn } from "../utils/cn";
import type { RiskLevel, Snapshot } from "../types";
import { RISK_LABEL } from "../types";

/* ---------------- sparkline of exposure over time ---------------- */

export function TrendSpark({
  snapshots,
  className,
}: {
  snapshots: Snapshot[];
  className?: string;
}) {
  const data = snapshots.length >= 1 ? snapshots : [{ date: "", exposure: 0, done: 0, total: 0 }];
  const w = 260;
  const h = 64;
  const max = 100;
  const stepX = data.length > 1 ? w / (data.length - 1) : 0;
  const pts = data.map((s, i) => ({ x: i * stepX, y: h - (Math.min(max, s.exposure) / max) * h }));
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area = `${path} L${w},${h} L0,${h} Z`;
  const first = data[0].exposure;
  const last = data[data.length - 1].exposure;
  const delta = Math.round(last - first);

  return (
    <div className={className}>
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-xl font-bold text-paper">
          {last}
          <span className="text-xs text-faint">% now</span>
        </span>
        <span className={cn("font-mono text-[11px] font-bold", delta < 0 ? "text-mint-300" : delta > 0 ? "text-flare-300" : "text-faint")}>
          {delta === 0 ? "no change" : `${delta > 0 ? "+" : ""}${delta} since start`}
        </span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="mt-2 h-16 w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-mint-500)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--color-mint-500)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((g) => (
          <line key={g} x1="0" x2={w} y1={h * g} y2={h * g} stroke="var(--color-line-soft)" strokeWidth="1" />
        ))}
        {data.length === 1 ? (
          <circle cx={w / 2} cy={pts[0].y} r="3.5" fill="var(--color-mint-400)" />
        ) : (
          <>
            <motion.path d={area} fill="url(#sparkFill)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} />
            <motion.path
              d={path}
              fill="none"
              stroke="var(--color-mint-400)"
              strokeWidth="2"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
            />
            <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="3.5" fill="var(--color-mint-400)" />
          </>
        )}
      </svg>
      <p className="mt-1 font-mono text-[10px] text-faint">
        {data.length === 1 ? "Today is your first data point — the trend builds daily." : `${data.length} daily snapshots · exposure trend`}
      </p>
    </div>
  );
}

/* ---------------- risk distribution donut ---------------- */

const DONUT_COLOR: Record<RiskLevel, string> = {
  critical: "var(--color-flare-500)",
  high: "var(--color-gold-400)",
  medium: "var(--color-skyx-400)",
  low: "var(--color-ink-600)",
};

export function RiskDonut({
  byRisk,
  size = 132,
}: {
  byRisk: { risk: RiskLevel; remaining: number; total: number }[];
  size?: number;
}) {
  const stack = byRisk.filter((r) => r.remaining > 0);
  const sum = stack.reduce((n, r) => n + r.remaining, 0);
  const R = 52;
  const C = 2 * Math.PI * R;
  let acc = 0;

  return (
    <div className="flex items-center gap-5">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg viewBox="0 0 130 130" className="h-full w-full -rotate-90">
          <circle cx="65" cy="65" r={R} fill="none" stroke="var(--color-ink-700)" strokeWidth="13" />
          {sum > 0 &&
            stack.map((r) => {
              const frac = r.remaining / sum;
              const dash = C * frac;
              const el = (
                <motion.circle
                  key={r.risk}
                  cx="65"
                  cy="65"
                  r={R}
                  fill="none"
                  stroke={DONUT_COLOR[r.risk]}
                  strokeWidth="13"
                  strokeDasharray={`${dash} ${C - dash}`}
                  strokeDashoffset={-C * acc}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.35 }}
                />
              );
              acc += frac;
              return el;
            })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-xl font-bold text-paper">{sum}</span>
          <span className="font-mono text-[9px] uppercase tracking-widest text-faint">weight left</span>
        </div>
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        {byRisk.map((r) => (
          <div key={r.risk} className="flex items-center gap-2 text-[11px]">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: DONUT_COLOR[r.risk] }} />
            <span className="flex-1 font-semibold text-mist">{RISK_LABEL[r.risk]}</span>
            <span className="font-mono text-faint">
              {r.remaining}/{r.total}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- keyboard key ---------------- */

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex min-w-6 items-center justify-center rounded border border-line bg-ink-800 px-1.5 py-0.5 font-mono text-[10px] font-bold text-mist">
      {children}
    </kbd>
  );
}

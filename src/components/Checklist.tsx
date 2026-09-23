import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, CheckCheck, ExternalLink, ListPlus, Pin, Plus, Radar, ScanLine, Search, SkipForward, Trash2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { cn } from "../utils/cn";
import { CATALOG } from "../data/services";
import type { Category, RiskLevel, Service, TaskStatus, Vault } from "../types";
import { CATEGORIES } from "../types";
import { Button, EmptyState, Field, inputCls, Modal, RiskBadge, Seg, UpiBadge } from "./ui";

/* ================= service card ================= */

function ServiceCard({
  svc,
  onStatus,
  onToggleStep,
  onDelete,
  onNote,
}: {
  svc: Service;
  onStatus: (id: string, status: TaskStatus) => void;
  onToggleStep: (id: string, idx: number) => void;
  onDelete: (id: string) => void;
  onNote: (id: string, text: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [draft, setDraft] = useState(svc.notes ?? "");
  const stepsDone = svc.stepDone.filter(Boolean).length;
  const monoTone: Record<RiskLevel, string> = {
    critical: "border-flare-500/30 bg-flare-500/10 text-flare-300",
    high: "border-gold-400/30 bg-gold-400/10 text-gold-300",
    medium: "border-skyx-400/30 bg-skyx-400/10 text-skyx-300",
    low: "border-line bg-ink-800 text-mist",
  };
  const closed = svc.status === "done" || svc.status === "skipped";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.18 }}
      className={cn(
        "rounded-xl border bg-ink-850 transition-colors",
        closed ? "border-line-soft opacity-70" : "border-line hover:border-ink-600",
      )}
    >
      <div className="flex items-start gap-3 p-4">
        <span className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border font-display text-sm font-bold", monoTone[svc.risk])}>
          {svc.name[0]}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className={cn("font-display text-[15px] font-semibold", closed ? "text-mist" : "text-paper")}>{svc.name}</h3>
            <RiskBadge risk={svc.risk} />
            {svc.isUpi && <UpiBadge />}
            {svc.custom && (
              <span className="rounded border border-line bg-ink-800 px-1.5 py-px font-mono text-[10px] uppercase tracking-wide text-faint">
                custom
              </span>
            )}
          </div>

          {svc.steps.length > 0 && (
            <button
              onClick={() => setOpen((o) => !o)}
              className="mt-2 flex items-center gap-1.5 font-mono text-[11px] font-semibold text-mist transition-colors hover:text-mint-300"
            >
              <ChevronDown size={12} className={cn("transition-transform", open && "rotate-180")} />
              Steps {stepsDone}/{svc.steps.length}
            </button>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Seg
              value={svc.status}
              onChange={(v) => onStatus(svc.id, v)}
              options={[
                { value: "pending", label: "Pending", tone: "gold" },
                { value: "in_progress", label: "Doing", tone: "sky" },
                { value: "done", label: "Done", tone: "mint" },
                { value: "skipped", label: "N/A", tone: "none" },
              ]}
            />
            {svc.url && (
              <a
                href={svc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-[11px] font-bold text-mist transition-colors hover:border-skyx-400/40 hover:text-skyx-300"
              >
                Portal <ExternalLink size={11} />
              </a>
            )}
          </div>
        </div>
        <button
          onClick={() => onDelete(svc.id)}
          className="shrink-0 rounded-md p-1.5 text-faint transition-colors hover:bg-flare-500/10 hover:text-flare-300"
          title="Remove service"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open && svc.steps.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="space-y-1 border-t border-line-soft bg-ink-900/40 p-3">
              {svc.steps.map((step, i) => (
                <button
                  key={i}
                  onClick={() => onToggleStep(svc.id, i)}
                  className="flex w-full items-start gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-ink-800"
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                      svc.stepDone[i] ? "border-mint-500 bg-mint-500 text-ink-950" : "border-ink-600 bg-ink-900",
                    )}
                  >
                    {svc.stepDone[i] && <Check size={11} strokeWidth={3.5} />}
                  </span>
                  <span className={cn("text-xs leading-relaxed", svc.stepDone[i] ? "text-faint line-through" : "text-mist")}>
                    {step}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* notes */}
      <div className="border-t border-line-soft bg-ink-900/40 px-3 py-2">
        {noteOpen ? (
          <div className="space-y-2">
            <textarea
              className={`${inputCls} min-h-16 resize-y text-xs`}
              placeholder="Branch visit needed · CIF 123456 · registered email X…"
              value={draft}
              autoFocus
              onChange={(e) => setDraft(e.target.value)}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => {
                  onNote(svc.id, draft.trim());
                  setNoteOpen(false);
                }}
              >
                Save note
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setDraft(svc.notes ?? "");
                  setNoteOpen(false);
                }}
              >
                Cancel
              </Button>
              {svc.notes && (
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => {
                    setDraft("");
                    onNote(svc.id, "");
                    setNoteOpen(false);
                  }}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2">
            <button
              onClick={() => setNoteOpen(true)}
              className="flex shrink-0 items-center gap-1.5 rounded-md px-1.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wide text-faint transition-colors hover:bg-ink-800 hover:text-gold-300"
            >
              <Pin size={11} /> {svc.notes ? "edit note" : "add note"}
            </button>
            {svc.notes && <p className="min-w-0 flex-1 pt-1 text-[11px] leading-snug text-mist">{svc.notes}</p>}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ================= scan modal ================= */

const SCAN_PHASES = [
  "Reading Indian service catalog…",
  "Checking banks & UPI rails…",
  "Flagging government IDs…",
  "Cross-referencing your vault…",
];

export function ScanModal({
  open,
  onClose,
  vault,
  onScan,
}: {
  open: boolean;
  onClose: () => void;
  vault: Vault;
  onScan: (cats: Category[]) => void;
}) {
  const [cats, setCats] = useState<Category[]>([...CATEGORIES]);
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState(0);
  const [added, setAdded] = useState(0);
  const ranRef = useRef(false);
  const timersRef = useRef<{ tick?: number; finish?: number }>({});

  const tracked = useMemo(() => new Set(vault.services.map((s) => s.name.toLowerCase())), [vault.services]);
  const missingFor = (cat: Category) => CATALOG.filter((c) => c.category === cat && !tracked.has(c.name.toLowerCase()));
  const totalMissing = cats.reduce((n, c) => n + missingFor(c).length, 0);

  const toggle = (c: Category) => setCats((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  const run = () => {
    if (running || cats.length === 0) return;
    ranRef.current = false;
    setRunning(true);
    setPhase(0);
    timersRef.current.tick = window.setInterval(() => setPhase((p) => Math.min(SCAN_PHASES.length - 1, p + 1)), 420);
    timersRef.current.finish = window.setTimeout(() => {
      window.clearInterval(timersRef.current.tick);
      if (!ranRef.current) {
        ranRef.current = true;
        setAdded(totalMissing);
        onScan(cats);
      }
    }, 1750);
  };

  const reset = () => {
    // cancelling mid-scan must not silently write to the vault
    window.clearInterval(timersRef.current.tick);
    window.clearTimeout(timersRef.current.finish);
    ranRef.current = true;
    setRunning(false);
    setAdded(0);
    setPhase(0);
    setCats([...CATEGORIES]);
    onClose();
  };

  return (
    <Modal open={open} onClose={reset} title="Smart scan" subtitle="Pull in the curated Indian service catalog, deduped against your vault">
      {running && added === 0 && (
        <div className="space-y-4 py-4">
          <div className="relative overflow-hidden rounded-xl border border-line bg-ink-900/70 p-4">
            <div
              className="absolute inset-y-0 left-0 bg-mint-500/10"
              style={{ animation: "scan-sweep 1.7s linear forwards" }}
            />
            <style>{`@keyframes scan-sweep { from { width: 0% } to { width: 100% } }`}</style>
            <div className="flex items-center gap-3">
              <ScanLine size={18} className="shrink-0 text-mint-400" />
              <div className="flex-1">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={phase}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="font-mono text-xs font-semibold text-paper"
                  >
                    {SCAN_PHASES[phase]}
                  </motion.p>
                </AnimatePresence>
                <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-ink-700">
                  <motion.div
                    className="h-full rounded-full bg-mint-500"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 1.7, ease: "linear" }}
                  />
                </div>
              </div>
            </div>
          </div>
          <p className="text-center font-mono text-[11px] text-faint">
            Scanning {cats.length} categories · {totalMissing} services to add
          </p>
        </div>
      )}
      {running && added > 0 ? (
        <div className="space-y-4 py-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl border border-mint-500/25 bg-mint-500/5 px-4 py-5 text-center"
          >
            <p className="font-display text-base font-bold text-mint-300">
              Scan complete — {added} service{added !== 1 ? "s" : ""} added.
            </p>
            <p className="mt-1 text-xs text-mist">They're waiting in your checklist, grouped by category.</p>
          </motion.div>
          <Button className="w-full" onClick={reset}>
            Review checklist
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map((c) => {
              const on = cats.includes(c);
              const miss = missingFor(c).length;
              return (
                <button
                  key={c}
                  onClick={() => toggle(c)}
                  className={cn(
                    "flex items-center justify-between rounded-lg border px-3 py-2.5 text-left text-xs font-semibold transition-colors",
                    on ? "border-mint-500/40 bg-mint-500/10 text-paper" : "border-line bg-ink-900/50 text-faint",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span className={cn("flex h-4 w-4 items-center justify-center rounded border", on ? "border-mint-500 bg-mint-500 text-ink-950" : "border-ink-600")}>
                      {on && <Check size={10} strokeWidth={3.5} />}
                    </span>
                    {c}
                  </span>
                  <span className="font-mono text-[10px] text-faint">{miss > 0 ? `+${miss}` : "·"}</span>
                </button>
              );
            })}
          </div>
          {totalMissing === 0 ? (
            <p className="rounded-lg border border-line bg-ink-900/60 px-3 py-2.5 text-center text-xs text-mist">
              Every service in the selected categories is already in your vault.
            </p>
          ) : (
            <p className="text-center text-xs text-mist">
              <b className="font-mono text-mint-300">{totalMissing}</b> services will be added (duplicates are skipped).
            </p>
          )}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={reset}>
              Cancel
            </Button>
            <Button className="flex-1" disabled={totalMissing === 0 || cats.length === 0} onClick={run} icon={<Radar size={15} />}>
              Run scan
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

/* ================= add service modal ================= */

export function AddServiceModal({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (s: { name: string; category: Category; risk: RiskLevel; url: string; isUpi: boolean; steps: string[] }) => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("Banking");
  const [risk, setRisk] = useState<RiskLevel>("high");
  const [url, setUrl] = useState("");
  const [isUpi, setUpi] = useState(false);
  const [steps, setSteps] = useState("");
  const ok = name.trim().length >= 2;

  const submit = () => {
    if (!ok) return;
    onAdd({
      name: name.trim(),
      category,
      risk,
      url: url.trim() || "",
      isUpi: isUpi || category === "UPI",
      steps: steps.split("\n").map((s) => s.trim()).filter(Boolean),
    });
    setName("");
    setUrl("");
    setSteps("");
    setRisk("high");
    setUpi(false);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Add a service" subtitle="Track any account that's bound to this number">
      <div className="space-y-4">
        <Field label="Service name">
          <input className={inputCls} placeholder="e.g. Kotak Mahindra Bank" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Category">
            <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value as Category)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Risk level">
            <select className={inputCls} value={risk} onChange={(e) => setRisk(e.target.value as RiskLevel)}>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </Field>
        </div>
        <Field label="Portal URL" hint="optional">
          <input className={inputCls} placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} />
        </Field>
        <Field label="Steps" hint="one per line · optional">
          <textarea
            className={`${inputCls} min-h-20 resize-y font-mono text-xs`}
            placeholder={"Log in\nChange registered mobile\nVerify OTP"}
            value={steps}
            onChange={(e) => setSteps(e.target.value)}
          />
        </Field>
        <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-line bg-ink-900/50 px-3 py-2.5">
          <input type="checkbox" checked={isUpi || category === "UPI"} onChange={(e) => setUpi(e.target.checked)} className="accent-[#2bcf8c]" disabled={category === "UPI"} />
          <span className="text-xs font-semibold text-mist">
            Handles UPI IDs — include in the UPI safety protocol
          </span>
        </label>
        <div className="flex gap-2 pt-1">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button className="flex-1" disabled={!ok} onClick={submit} icon={<ListPlus size={15} />}>
            Add to vault
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/* ================= checklist view ================= */

type RiskFilter = "all" | RiskLevel;
type StatusFilter = "all" | TaskStatus;

export function Checklist({
  vault,
  onStatus,
  onToggleStep,
  onDelete,
  onNote,
  onBulk,
  onOpenScan,
  onOpenAdd,
}: {
  vault: Vault;
  onStatus: (id: string, status: TaskStatus) => void;
  onToggleStep: (id: string, idx: number) => void;
  onDelete: (id: string) => void;
  onNote: (id: string, text: string) => void;
  onBulk: (ids: string[], status: TaskStatus) => void;
  onOpenScan: () => void;
  onOpenAdd: () => void;
}) {
  const [q, setQ] = useState("");
  const [risk, setRisk] = useState<RiskFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return vault.services.filter(
      (s) =>
        (risk === "all" || s.risk === risk) &&
        (status === "all" || s.status === status) &&
        (query === "" || s.name.toLowerCase().includes(query) || (s.notes ?? "").toLowerCase().includes(query)),
    );
  }, [vault.services, q, risk, status]);

  const groups = CATEGORIES.map((c) => ({ cat: c, items: filtered.filter((s) => s.category === c) })).filter(
    (g) => g.items.length > 0,
  );
  const filtering = q.trim() !== "" || risk !== "all" || status !== "all";

  return (
    <div className="space-y-5">
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-52 flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
          <input
            className={`${inputCls} pl-9`}
            placeholder="Search services…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {(["all", "critical", "high", "medium", "low"] as RiskFilter[]).map((r) => (
            <button
              key={r}
              onClick={() => setRisk(r)}
              className={cn(
                "rounded-lg border px-2.5 py-1.5 text-[11px] font-bold capitalize transition-colors",
                risk === r
                  ? r === "critical"
                    ? "border-flare-500/40 bg-flare-500/15 text-flare-300"
                    : r === "high"
                      ? "border-gold-400/40 bg-gold-400/15 text-gold-300"
                      : r === "medium"
                        ? "border-skyx-400/40 bg-skyx-400/15 text-skyx-300"
                        : "border-mint-500/40 bg-mint-500/15 text-mint-300"
                  : "border-line text-faint hover:text-mist",
              )}
            >
              {r}
            </button>
          ))}
        </div>
        <Seg
          value={status}
          onChange={setStatus}
          options={[
            { value: "all", label: "All" },
            { value: "pending", label: "Pending" },
            { value: "in_progress", label: "Doing" },
            { value: "done", label: "Done" },
            { value: "skipped", label: "N/A" },
          ]}
        />
        <Button size="sm" onClick={onOpenAdd} icon={<Plus size={14} />}>
          Add
        </Button>
      </div>

      {/* content */}
      {vault.services.length === 0 ? (
        <EmptyState
          icon={<Radar size={20} />}
          title="Your vault is empty"
          body="Run the Smart Scan to pull in ~30 Indian services worth checking, or add your first one manually."
          action={
            <div className="flex gap-2">
              <Button onClick={onOpenScan} icon={<ScanLine size={15} />}>
                Run smart scan
              </Button>
              <Button variant="outline" onClick={onOpenAdd} icon={<Plus size={15} />}>
                Add service
              </Button>
            </div>
          }
        />
      ) : groups.length === 0 ? (
        <EmptyState icon={<Search size={20} />} title="No matches" body="No services match the current search and filters." />
      ) : (
        <div className="space-y-6">
          {groups.map((g) => {
            const done = g.items.filter((s) => s.status === "done" || s.status === "skipped").length;
            return (
              <section key={g.cat}>
                <div className="mb-2.5 flex items-baseline justify-between px-1">
                  <h3 className="font-display text-sm font-bold tracking-wide text-paper">
                    {g.cat}
                    {!filtering && (
                      <span className="ml-2 font-mono text-[11px] font-medium text-faint">
                        {done}/{g.items.length}
                      </span>
                    )}
                  </h3>
                  <span className="h-px flex-1 mx-3 bg-line-soft" />
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      onClick={() => onBulk(g.items.filter((s) => s.status !== "done").map((s) => s.id), "done")}
                      className="flex items-center gap-1 rounded-md border border-line px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wide text-faint transition-colors hover:border-mint-500/40 hover:text-mint-300"
                      title={`Mark every open ${g.cat} service as done`}
                    >
                      <CheckCheck size={11} /> all
                    </button>
                    <button
                      onClick={() => onBulk(g.items.filter((s) => s.status !== "skipped").map((s) => s.id), "skipped")}
                      className="flex items-center gap-1 rounded-md border border-line px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wide text-faint transition-colors hover:border-ink-600 hover:text-mist"
                      title={`Mark all ${g.cat} services as not applicable`}
                    >
                      <SkipForward size={11} /> n/a
                    </button>
                  </div>
                </div>
                <div className="grid gap-2.5 xl:grid-cols-2">
                  <AnimatePresence>
                    {g.items.map((s) => (
                      <ServiceCard
                        key={s.id}
                        svc={s}
                        onStatus={onStatus}
                        onToggleStep={onToggleStep}
                        onDelete={onDelete}
                        onNote={onNote}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

import {
  CalendarClock,
  Download,
  FileJson,
  FileText,
  LayoutDashboard,
  ListChecks,
  MessageSquareText,
  Moon,
  PhoneCall,
  Plus,
  Radar,
  Search,
  ShieldCheck,
  Sun,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "../utils/cn";
import type { Service, TabId, Theme, Vault } from "../types";
import { Kbd } from "./charts";
import { Modal } from "./ui";

export interface PaletteAction {
  id: string;
  group: "Navigate" | "Actions" | "Services";
  label: string;
  hint?: string;
  icon: React.ReactNode;
  run: () => void;
}

export function CommandPalette({
  open,
  onClose,
  vault,
  theme,
  onTheme,
  onGoTab,
  onScan,
  onAddService,
  onIncident,
  onReport,
  onExport,
  onToggleService,
}: {
  open: boolean;
  onClose: () => void;
  vault: Vault;
  theme: Theme;
  onTheme: (t: Theme) => void;
  onGoTab: (t: TabId) => void;
  onScan: () => void;
  onAddService: () => void;
  onIncident: () => void;
  onReport: () => void;
  onExport: () => void;
  onToggleService: (id: string) => void;
}) {
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const actions: PaletteAction[] = useMemo(
    () => [
      { id: "tab-dashboard", group: "Navigate", label: "Go to Dashboard", hint: "1", icon: <LayoutDashboard size={14} />, run: () => onGoTab("dashboard") },
      { id: "tab-checklist", group: "Navigate", label: "Go to Checklist", hint: "2", icon: <ListChecks size={14} />, run: () => onGoTab("checklist") },
      { id: "tab-plan", group: "Navigate", label: "Go to 90-day Plan", hint: "3", icon: <CalendarClock size={14} />, run: () => onGoTab("plan") },
      { id: "tab-upi", group: "Navigate", label: "Go to UPI Protocol", hint: "4", icon: <ShieldCheck size={14} />, run: () => onGoTab("upi") },
      { id: "tab-broadcast", group: "Navigate", label: "Go to Broadcaster", hint: "5", icon: <MessageSquareText size={14} />, run: () => onGoTab("broadcast") },
      { id: "tab-spec", group: "Navigate", label: "Go to Spec (PRD)", hint: "6", icon: <FileJson size={14} />, run: () => onGoTab("spec") },
      { id: "act-scan", group: "Actions", label: "Run Smart Scan", hint: "S", icon: <Radar size={14} />, run: onScan },
      { id: "act-add", group: "Actions", label: "Add a service", hint: "N", icon: <Plus size={14} />, run: onAddService },
      { id: "act-incident", group: "Actions", label: "SIM lost / stolen — incident lane", hint: "!", icon: <PhoneCall size={14} />, run: onIncident },
      { id: "act-report", group: "Actions", label: "Download Markdown report", icon: <FileText size={14} />, run: onReport },
      { id: "act-export", group: "Actions", label: "Export vault JSON", icon: <Download size={14} />, run: onExport },
      {
        id: "act-theme",
        group: "Actions",
        label: theme === "dark" ? "Switch to light theme" : "Switch to dark theme",
        hint: "T",
        icon: theme === "dark" ? <Sun size={14} /> : <Moon size={14} />,
        run: () => onTheme(theme === "dark" ? "light" : "dark"),
      },
      ...vault.services.map(
        (s: Service): PaletteAction => ({
          id: `svc-${s.id}`,
          group: "Services",
          label: s.name,
          hint: s.status === "done" ? "done — press to reopen" : "press to mark done",
          icon: <span className="font-display text-[11px] font-bold">{s.name[0]}</span>,
          run: () => onToggleService(s.id),
        }),
      ),
    ],
    [vault.services, theme, onGoTab, onScan, onAddService, onIncident, onReport, onExport, onTheme, onToggleService],
  );

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    const filtered = query === "" ? actions : actions.filter((a) => a.label.toLowerCase().includes(query) || a.group.toLowerCase().includes(query));
    return filtered.slice(0, 40);
  }, [actions, q]);

  useEffect(() => {
    setCursor(0);
  }, [q, open]);

  useEffect(() => {
    if (!open) {
      setQ("");
      setCursor(0);
    }
  }, [open]);

  const runAt = (i: number) => {
    const a = results[i];
    if (!a) return;
    a.run();
    onClose();
  };

  let lastGroup = "";

  return (
    <Modal open={open} onClose={onClose} title="Command palette" subtitle="Jump anywhere, run any action" wide>
      <div className="space-y-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setCursor((c) => Math.min(results.length - 1, c + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setCursor((c) => Math.max(0, c - 1));
              } else if (e.key === "Enter") {
                e.preventDefault();
                runAt(cursor);
              }
            }}
            placeholder="Type a command, tab or service name…"
            className="w-full rounded-lg border border-line bg-ink-900/80 py-3 pl-9 pr-3 text-sm text-paper outline-none placeholder:text-faint focus:border-mint-500/50"
          />
        </div>

        <div ref={listRef} className="max-h-80 overflow-y-auto">
          {results.length === 0 && <p className="py-8 text-center text-xs text-faint">No matches for “{q}”.</p>}
          {results.map((a, i) => {
            const showGroup = a.group !== lastGroup;
            lastGroup = a.group;
            return (
              <div key={a.id}>
                {showGroup && (
                  <p className="px-2 pb-1 pt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-faint">{a.group}</p>
                )}
                <button
                  onMouseEnter={() => setCursor(i)}
                  onClick={() => runAt(i)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                    cursor === i ? "bg-ink-700/70" : "hover:bg-ink-800",
                  )}
                >
                  <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-line bg-ink-900", cursor === i ? "text-mint-300" : "text-mist")}>
                    {a.icon}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-paper">{a.label}</span>
                  {a.hint && <span className="shrink-0 font-mono text-[10px] text-faint">{a.hint}</span>}
                </button>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-line-soft pt-3 text-[11px] text-faint">
          <span className="flex items-center gap-1.5"><Kbd>↑</Kbd><Kbd>↓</Kbd> move</span>
          <span className="flex items-center gap-1.5"><Kbd>↵</Kbd> run</span>
          <span className="flex items-center gap-1.5"><Kbd>Esc</Kbd> close</span>
          <span className="ml-auto flex items-center gap-1.5">
            <Kbd>⌘</Kbd><Kbd>K</Kbd> anywhere
          </span>
        </div>
      </div>
    </Modal>
  );
}

/* ---------------- shortcut sheet ---------------- */

export function ShortcutSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const rows: [string[], string][] = [
    [["⌘", "K"], "Open the command palette"],
    [["1"], "Dashboard"],
    [["2"], "Checklist"],
    [["3"], "90-day plan"],
    [["4"], "UPI protocol"],
    [["5"], "Broadcaster"],
    [["6"], "Spec (PRD)"],
    [["S"], "Run the Smart Scan"],
    [["N"], "Add a service"],
    [["T"], "Toggle light / dark theme"],
    [["!"], "Incident lane (SIM lost / stolen)"],
    [["?"], "This sheet"],
    [["Esc"], "Close overlays"],
  ];
  return (
    <Modal open={open} onClose={onClose} title="Keyboard shortcuts" subtitle="Everything reachable without the mouse">
      <div className="space-y-1.5">
        {rows.map(([keys, label]) => (
          <div key={label} className="flex items-center justify-between gap-3 rounded-lg border border-line-soft bg-ink-900/40 px-3 py-2">
            <span className="text-xs font-semibold text-mist">{label}</span>
            <span className="flex gap-1">
              {keys.map((k) => (
                <Kbd key={k}>{k}</Kbd>
              ))}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-faint">
        Shortcuts are ignored while typing in a field. <Kbd>⌘</Kbd> is <Kbd>Ctrl</Kbd> on Windows and Linux.
      </p>
    </Modal>
  );
}

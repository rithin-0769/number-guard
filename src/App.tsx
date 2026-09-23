import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarClock,
  Command,
  FileJson,
  LayoutDashboard,
  ListChecks,
  Menu,
  MessageSquareText,
  Moon,
  PhoneCall,
  Radar,
  ScanLine,
  ShieldCheck,
  Sun,
  TimerReset,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { cn } from "./utils/cn";
import { CATALOG } from "./data/services";
import { INCIDENT_STEPS } from "./data/plan";
import {
  createVault,
  daysUntilRecycle,
  deleteVault as removeVault,
  downloadReport,
  exportVault,
  fmtPhone,
  loadActive,
  loadIndex,
  loadTheme,
  loadVault,
  parseImportedVault,
  recordSnapshot,
  riskReport,
  saveActive,
  saveTheme,
  saveVault,
  scoreLabel,
  uid,
  urgencyOf,
  withLog,
} from "./lib/storage";
import type { Category, ContactGroup, Service, TabId, TaskStatus, Theme, Vault } from "./types";
import { AddServiceModal, Checklist, ScanModal } from "./components/Checklist";
import { CommandPalette, ShortcutSheet } from "./components/CommandPalette";
import { Dashboard } from "./components/Dashboard";
import { Broadcaster } from "./components/Broadcaster";
import { Plan } from "./components/Plan";
import { SetupWizard, type VaultMeta } from "./components/SetupWizard";
import { Sidebar } from "./components/Sidebar";
import { SpecView } from "./components/SpecView";
import { UpiProtocol } from "./components/UpiProtocol";
import { Button, Modal, Progress, Toasts, type Toast } from "./components/ui";

/* ---------------- toasts ---------------- */

function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const dismiss = useCallback((id: string) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const toast = useCallback(
    (msg: string, tone: Toast["tone"] = "mint") => {
      const id = uid();
      setToasts((t) => [...t.slice(-3), { id, msg, tone }]);
      setTimeout(() => dismiss(id), 3400);
    },
    [dismiss],
  );
  return { toasts, toast, dismiss };
}

const toService = (c: (typeof CATALOG)[number]): Service => ({
  ...c,
  id: uid(),
  status: "pending",
  stepDone: c.steps.map(() => false),
  addedAt: Date.now(),
});

const TABS: { id: TabId; label: string; icon: React.ReactNode; key: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={14} />, key: "1" },
  { id: "checklist", label: "Checklist", icon: <ListChecks size={14} />, key: "2" },
  { id: "plan", label: "Plan", icon: <CalendarClock size={14} />, key: "3" },
  { id: "upi", label: "UPI Protocol", icon: <ShieldCheck size={14} />, key: "4" },
  { id: "broadcast", label: "Broadcaster", icon: <MessageSquareText size={14} />, key: "5" },
  { id: "spec", label: "Spec", icon: <FileJson size={14} />, key: "6" },
];

export default function App() {
  const [vaultsMeta, setVaultsMeta] = useState<VaultMeta[]>([]);
  const [vault, setVault] = useState<Vault | null>(null);
  const [tab, setTab] = useState<TabId>("dashboard");
  const [theme, setTheme] = useState<Theme>("dark");
  const [drawer, setDrawer] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [incidentOpen, setIncidentOpen] = useState(false);
  const [confirm, setConfirm] = useState<null | { title: string; body: string; label: string; action: () => void }>(null);
  const { toasts, toast, dismiss } = useToasts();

  /* ---------------- boot ---------------- */

  const refreshMeta = useCallback(() => {
    setVaultsMeta(
      loadIndex()
        .map((p) => {
          const v = loadVault(p);
          if (!v) return null;
          return {
            phone: p,
            serviceCount: v.services.length,
            doneCount: v.services.filter((s) => s.status === "done" || s.status === "skipped").length,
            daysLeft: daysUntilRecycle(v.simDropDate),
          };
        })
        .filter((x): x is VaultMeta => x !== null),
    );
  }, []);

  useEffect(() => {
    refreshMeta();
    setTheme(loadTheme());
    const p = loadActive();
    if (p) {
      const v = loadVault(p);
      if (v) setVault(v);
    }
  }, [refreshMeta]);

  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
    saveTheme(theme);
  }, [theme]);

  const mutate = useCallback(
    (fn: (v: Vault) => Vault) => {
      setVault((prev) => {
        if (!prev) return prev;
        return saveVault(recordSnapshot(fn(prev)));
      });
      refreshMeta();
    },
    [refreshMeta],
  );

  /* ---------------- vault ops ---------------- */

  const openVault = (phone: string) => {
    const v = loadVault(phone);
    if (!v) {
      toast("Vault not found on this device", "flare");
      return;
    }
    setVault(v);
    saveActive(phone);
    setTab("dashboard");
    setDrawer(false);
  };

  const handleCreateVault = (phone: string, newNumber: string | undefined, simDropDate: string, cats: Category[]) => {
    let v = createVault(phone, newNumber, simDropDate);
    const adding = CATALOG.filter((c) => cats.includes(c.category));
    v = saveVault(
      withLog(
        recordSnapshot({ ...v, services: adding.map(toService) }),
        "scan",
        `Guided setup added ${adding.length} services across ${cats.length} categories`,
      ),
    );
    setVault(v);
    saveActive(phone);
    refreshMeta();
    setTab("dashboard");
    toast(`Vault ready — ${adding.length} services queued`, "mint");
  };

  const askDeleteVault = (phone: string) => {
    setConfirm({
      title: `Delete vault ${fmtPhone(phone)}?`,
      body: "This permanently removes the checklist, notes, contacts, activity log and protocol progress from this browser. Consider exporting a JSON backup first.",
      label: "Delete vault",
      action: () => {
        removeVault(phone);
        if (vault?.phone === phone) {
          setVault(null);
          saveActive(null);
        }
        refreshMeta();
        toast("Vault deleted", "sky");
      },
    });
  };

  /* ---------------- service ops ---------------- */

  const setStatus = (id: string, status: TaskStatus) => {
    const svc = vault?.services.find((s) => s.id === id);
    mutate((v) =>
      withLog(
        {
          ...v,
          services: v.services.map((s) => (s.id === id ? { ...s, status, doneAt: status === "done" ? Date.now() : s.doneAt } : s)),
        },
        "status",
        `“${svc?.name ?? "Service"}” → ${status.replace("_", " ")}`,
      ),
    );
    if (svc && status === "done") toast(`${svc.name} marked done — exposure down`, "mint");
    if (svc && status === "skipped") toast(`${svc.name} marked not applicable`, "sky");
  };

  const toggleStep = (id: string, idx: number) => {
    const svc = vault?.services.find((s) => s.id === id);
    if (!svc || svc.steps.length === 0) return;
    const stepDone = svc.steps.map((_, i) => (i === idx ? !svc.stepDone[i] : svc.stepDone[i]));
    const allDone = stepDone.every(Boolean);
    const anyDone = stepDone.some(Boolean);
    const nextStatus: TaskStatus = allDone ? "done" : anyDone ? "in_progress" : "pending";
    mutate((v) => ({
      ...v,
      services: v.services.map((s) =>
        s.id === id ? { ...s, stepDone, status: nextStatus, doneAt: nextStatus === "done" ? Date.now() : s.doneAt } : s,
      ),
    }));
    if (allDone) toast(`All steps cleared — ${svc.name} is done`, "mint");
  };

  const setNote = (id: string, text: string) => {
    const svc = vault?.services.find((s) => s.id === id);
    mutate((v) =>
      withLog(
        { ...v, services: v.services.map((s) => (s.id === id ? { ...s, notes: text || undefined } : s)) },
        "note",
        `Note ${text ? "saved" : "cleared"} on “${svc?.name ?? "service"}”`,
      ),
    );
    toast(text ? "Note saved" : "Note cleared", text ? "mint" : "sky");
  };

  const bulkStatus = (ids: string[], status: TaskStatus) => {
    if (ids.length === 0) return;
    mutate((v) =>
      withLog(
        {
          ...v,
          services: v.services.map((s) => (ids.includes(s.id) ? { ...s, status, doneAt: status === "done" ? Date.now() : s.doneAt } : s)),
        },
        "status",
        `Bulk update — ${ids.length} service${ids.length > 1 ? "s" : ""} → ${status === "skipped" ? "not applicable" : status}`,
      ),
    );
    toast(`${ids.length} services updated`, "mint");
  };

  const addService = (data: { name: string; category: Category; risk: Service["risk"]; url: string; isUpi: boolean; steps: string[] }) => {
    if (vault?.services.some((s) => s.name.toLowerCase() === data.name.toLowerCase())) {
      toast(`${data.name} is already in the vault`, "gold");
      return;
    }
    const svc: Service = { ...data, id: uid(), status: "pending", stepDone: data.steps.map(() => false), custom: true, addedAt: Date.now() };
    mutate((v) => withLog({ ...v, services: [...v.services, svc] }, "status", `Custom service added: ${data.name}`));
    toast(`${data.name} added to the checklist`, "mint");
  };

  const deleteService = (id: string) => {
    const svc = vault?.services.find((s) => s.id === id);
    mutate((v) => withLog({ ...v, services: v.services.filter((s) => s.id !== id) }, "status", `Removed “${svc?.name ?? "service"}”`));
    if (svc) toast(`${svc.name} removed`, "sky");
  };

  const runScan = (cats: Category[]) => {
    const tracked = new Set((vault?.services ?? []).map((s) => s.name.toLowerCase()));
    const adding = CATALOG.filter((c) => cats.includes(c.category) && !tracked.has(c.name.toLowerCase()));
    mutate((v) =>
      withLog(
        { ...v, services: [...v.services, ...adding.map(toService)] },
        "scan",
        `Smart scan — ${adding.length} service${adding.length === 1 ? "" : "s"} added (${cats.length} categories)`,
      ),
    );
    if (adding.length > 0) toast(`Scan added ${adding.length} services`, "mint");
    else toast("Nothing new — catalog fully covered", "sky");
    setTab("checklist");
  };

  /* ---------------- protocol / contacts / vault meta ---------------- */

  const toggleVpa = (stepId: string) => {
    const label = ["Inventory VPAs", "Migrate VPAs", "Update payers", "Settle balances", "Go-ahead gate"][
      ["vpa-1", "vpa-2", "vpa-3", "vpa-4", "vpa-5"].indexOf(stepId)
    ];
    mutate((v) => {
      const done = v.vpaDone ?? [];
      const next = done.includes(stepId) ? done.filter((x) => x !== stepId) : [...done, stepId];
      return withLog({ ...v, vpaDone: next }, "vpa", `UPI protocol · ${label ?? stepId} ${next.includes(stepId) ? "done" : "reopened"}`);
    });
  };

  const toggleIncident = (stepId: string) => {
    const step = INCIDENT_STEPS.find((s) => s.id === stepId);
    mutate((v) => {
      const done = v.incident.done;
      const next = done.includes(stepId) ? done.filter((x) => x !== stepId) : [...done, stepId];
      return withLog({ ...v, incident: { ...v.incident, done: next } }, "incident", `${step?.title ?? "Incident step"} ${next.includes(stepId) ? "completed" : "reopened"}`);
    });
  };

  const setIncidentActive = (active: boolean) => {
    mutate((v) => withLog({ ...v, incident: { ...v.incident, active } }, "incident", active ? "Vault flagged as an active incident" : "Incident flag cleared"));
    toast(active ? "Vault flagged as an incident" : "Incident flag cleared", active ? "flare" : "sky");
  };

  const addContact = (name: string, number: string, group: ContactGroup) => {
    if (vault?.contacts.some((c) => c.number === number)) {
      toast(`${name} is already in the contact list`, "gold");
      return;
    }
    mutate((v) => withLog({ ...v, contacts: [...v.contacts, { id: uid(), name, number, group, notified: false }] }, "contact", `Contact added: ${name} (${group})`));
    toast(`${name} added to the broadcast list`, "mint");
  };

  const bulkAddContacts = (rows: { name: string; number: string; group: ContactGroup }[]) => {
    let added = 0;
    mutate((v) => {
      const seen = new Set(v.contacts.map((c) => c.number));
      const fresh: typeof rows = [];
      for (const r of rows) {
        if (seen.has(r.number)) continue; // duplicate against vault or earlier line
        seen.add(r.number);
        fresh.push(r);
      }
      added = fresh.length;
      return withLog(
        { ...v, contacts: [...v.contacts, ...fresh.map((r) => ({ id: uid(), name: r.name, number: r.number, group: r.group, notified: false }))] },
        "contact",
        `Bulk import — ${fresh.length} of ${rows.length} contacts added`,
      );
    });
    toast(added > 0 ? `${added} contacts imported` : "No new contacts found in that paste", added > 0 ? "mint" : "gold");
  };

  const deleteContact = (id: string) => mutate((v) => ({ ...v, contacts: v.contacts.filter((c) => c.id !== id) }));
  const toggleNotified = (id: string) =>
    mutate((v) => withLog({ ...v, contacts: v.contacts.map((c) => (c.id === id ? { ...c, notified: !c.notified } : c)) }, "contact", "Contact notification status updated"));

  const setDropDate = (iso: string) => {
    mutate((v) => withLog({ ...v, simDropDate: iso }, "date", `SIM drop date set to ${iso}`));
    toast("Recycle clock re-planned", "sky");
  };
  const setNewNumber = (n: string) => mutate((v) => ({ ...v, newNumber: n || undefined }));
  const setTemplate = (t: string) => mutate((v) => ({ ...v, messageTemplate: t }));

  /* ---------------- data in / out ---------------- */

  const handleExport = () => {
    if (!vault) return;
    exportVault(vault);
    mutate((v) => withLog(v, "data", "Vault exported as JSON"));
    toast("Vault JSON downloaded", "mint");
  };

  const handleReport = () => {
    if (!vault) return;
    downloadReport(vault);
    mutate((v) => withLog(v, "data", "Markdown status report downloaded"));
    toast("Status report downloaded", "mint");
  };

  const handleImport = (file: File) => {
    parseImportedVault(file)
      .then((v) => {
        setVault(v);
        saveActive(v.phone);
        refreshMeta();
        toast(`Vault ${fmtPhone(v.phone)} imported and opened`, "mint");
      })
      .catch((e: Error) => toast(e.message, "flare"));
  };

  /* ---------------- keyboard shortcuts ---------------- */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement as HTMLElement | null;
      const typing =
        !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable);
      const mod = e.metaKey || e.ctrlKey;

      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(true);
        return;
      }
      if (e.key === "Escape") {
        setPaletteOpen(false);
        setSheetOpen(false);
        setIncidentOpen(false);
        setConfirm(null);
        setDrawer(false);
        return;
      }
      if (typing || mod) return;
      if (!vault) return;

      if (e.key === "?") {
        e.preventDefault();
        setSheetOpen(true);
        return;
      }
      const lower = e.key.toLowerCase();
      if (lower === "t") {
        setTheme((t) => (t === "dark" ? "light" : "dark"));
        return;
      }
      if (lower === "s") {
        setScanOpen(true);
        return;
      }
      if (lower === "n") {
        setAddOpen(true);
        return;
      }
      if (e.key === "!") {
        setIncidentOpen(true);
        return;
      }
      const byKey = TABS.find((t) => t.key === e.key);
      if (byKey) setTab(byKey.id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [vault]);

  /* ---------------- derived ---------------- */

  if (!vault) {
    return (
      <>
        <SetupWizard
          vaults={vaultsMeta}
          onOpen={openVault}
          onCreate={handleCreateVault}
          onScanOnly={() => vaultsMeta[0] && openVault(vaultsMeta[0].phone)}
        />
        <Toasts toasts={toasts} dismiss={dismiss} />
      </>
    );
  }

  const rep = riskReport(vault.services);
  const daysLeft = daysUntilRecycle(vault.simDropDate);
  const exposure = rep.score;
  const urgency = urgencyOf(daysLeft, exposure);
  const sl = scoreLabel(exposure);
  const pendingUpi = vault.services.filter((s) => s.isUpi && s.status !== "done" && s.status !== "skipped").length;
  const unnotified = vault.contacts.filter((c) => !c.notified).length;
  const incidentOpenCount = vault.incident.done.length;

  const pillTone =
    urgency === "critical" || urgency === "missed"
      ? "border-flare-500/40 bg-flare-500/10 text-flare-300"
      : urgency === "warning"
        ? "border-gold-400/40 bg-gold-400/10 text-gold-300"
        : "border-mint-500/30 bg-mint-500/10 text-mint-300";

  const sidebarProps = {
    vault,
    vaults: vaultsMeta,
    exposure,
    theme,
    onToggleTheme: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
    onSelect: openVault,
    onNew: () => {
      setDrawer(false);
      setVault(null);
      saveActive(null);
    },
    onDeleteVault: askDeleteVault,
    onExport: handleExport,
    onImport: handleImport,
    onReport: handleReport,
    onIncident: () => setIncidentOpen(true),
    onOpenSpec: () => {
      setDrawer(false);
      setTab("spec");
    },
  };

  return (
    <div className="flex min-h-screen bg-ink-950">
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-line-soft bg-ink-900/50 lg:block">
        <Sidebar {...sidebarProps} />
      </aside>

      <AnimatePresence>
        {drawer && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-scrim backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawer(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 w-75 overflow-y-auto border-r border-line bg-ink-900 lg:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
            >
              <button
                onClick={() => setDrawer(false)}
                className="absolute right-3 top-3 z-10 rounded-md p-1.5 text-mist transition-colors hover:bg-ink-700 hover:text-paper"
                aria-label="Close menu"
              >
                <X size={16} />
              </button>
              <Sidebar {...sidebarProps} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-line-soft bg-ink-950/85 backdrop-blur">
          <div className="flex h-14 items-center gap-2 px-4 sm:px-6">
            <button
              onClick={() => setDrawer(true)}
              className="rounded-lg border border-line p-2 text-mist transition-colors hover:text-paper lg:hidden"
              aria-label="Open menu"
            >
              <Menu size={16} />
            </button>

            <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
              {TABS.map((t) => {
                const badge = t.id === "upi" ? pendingUpi : t.id === "broadcast" ? unnotified : 0;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    title={`${t.label} (${t.key})`}
                    aria-current={tab === t.id}
                    className={cn(
                      "flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold transition-colors",
                      tab === t.id ? "border-line bg-ink-800 text-paper" : "border-transparent text-faint hover:text-mist",
                    )}
                  >
                    <span className={cn(tab === t.id && (t.id === "upi" && pendingUpi > 0 ? "text-flare-400" : "text-mint-400"))}>
                      {t.icon}
                    </span>
                    <span className="hidden sm:inline">{t.label}</span>
                    {badge > 0 && (
                      <span
                        className={cn(
                          "flex h-4 min-w-4 items-center justify-center rounded-full px-1 font-mono text-[9px] font-bold",
                          t.id === "upi" ? "bg-flare-500/20 text-flare-300" : "bg-gold-400/20 text-gold-300",
                        )}
                      >
                        {badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <button
              onClick={() => setTab("dashboard")}
              className={cn("hidden items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[11px] font-bold xl:flex", pillTone)}
              title={`Exposure ${exposure ?? "—"}% · ${sl.text}`}
            >
              <TimerReset size={12} />
              {daysLeft < 0 ? "window missed" : `${daysLeft}d left`}
              {exposure !== null && <span className="opacity-70">· {exposure}% exposure</span>}
            </button>

            <button
              onClick={() => setPaletteOpen(true)}
              className="hidden items-center gap-2 rounded-lg border border-line px-2.5 py-2 text-[11px] font-bold text-mist transition-colors hover:border-mint-500/40 hover:text-mint-300 md:flex"
              title="Command palette (⌘K)"
            >
              <Command size={13} />
              <span className="font-mono">⌘K</span>
            </button>

            {incidentOpenCount < INCIDENT_STEPS.length && (
              <button
                onClick={() => setIncidentOpen(true)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-[11px] font-bold transition-colors",
                  vault.incident.active
                    ? "border-flare-500/40 bg-flare-500/10 text-flare-300"
                    : "border-line text-mist hover:border-flare-500/40 hover:text-flare-300",
                )}
                title="Incident lane — SIM lost or stolen (!)"
              >
                <PhoneCall size={13} />
                <span className="hidden lg:inline">Incident</span>
              </button>
            )}

            <button
              onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
              className="rounded-lg border border-line p-2 text-mist transition-colors hover:border-mint-500/40 hover:text-mint-300"
              aria-label="Toggle theme"
              title="Toggle theme (T)"
            >
              {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
            </button>

            <Button size="sm" onClick={() => setScanOpen(true)} icon={<Radar size={13} />} className="shrink-0">
              <span className="hidden sm:inline">Scan</span>
            </Button>
          </div>
        </header>

        <main className="console-grid flex-1">
          <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.16 }}
              >
                {tab === "dashboard" && (
                  <Dashboard
                    vault={vault}
                    onDropDate={setDropDate}
                    onScan={() => setScanOpen(true)}
                    onMarkDone={(id) => setStatus(id, "done")}
                    onGoTab={setTab}
                    onReport={handleReport}
                  />
                )}
                {tab === "checklist" && (
                  <Checklist
                    vault={vault}
                    onStatus={setStatus}
                    onToggleStep={toggleStep}
                    onDelete={deleteService}
                    onNote={setNote}
                    onBulk={bulkStatus}
                    onOpenScan={() => setScanOpen(true)}
                    onOpenAdd={() => setAddOpen(true)}
                  />
                )}
                {tab === "plan" && (
                  <Plan
                    vault={vault}
                    onToggleIncident={toggleIncident}
                    onSetIncidentActive={setIncidentActive}
                    onGoChecklist={() => setTab("checklist")}
                    onGoUpi={() => setTab("upi")}
                  />
                )}
                {tab === "upi" && (
                  <UpiProtocol
                    vault={vault}
                    onToggleVpa={toggleVpa}
                    onToggleStep={toggleStep}
                    onStatus={setStatus}
                    onOpenScan={() => setScanOpen(true)}
                  />
                )}
                {tab === "broadcast" && (
                  <Broadcaster
                    vault={vault}
                    onSetNewNumber={setNewNumber}
                    onSetTemplate={setTemplate}
                    onAddContact={addContact}
                    onBulkAdd={bulkAddContacts}
                    onDeleteContact={deleteContact}
                    onToggleNotified={toggleNotified}
                    notify={toast}
                  />
                )}
                {tab === "spec" && <SpecView />}
              </motion.div>
            </AnimatePresence>
            <p className="mt-8 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 pb-4 text-center font-mono text-[10px] text-faint">
              <span className="flex items-center gap-1.5">
                <ScanLine size={10} className="text-mint-500" />
                NumberGuard v3 · local-only · your data never leaves this browser
              </span>
              <span>
                press <b className="text-mist">⌘K</b> for commands · <b className="text-mist">?</b> for shortcuts
              </span>
            </p>
          </div>
        </main>
      </div>

      {/* overlays */}
      <ScanModal open={scanOpen} onClose={() => setScanOpen(false)} vault={vault} onScan={runScan} />
      <AddServiceModal open={addOpen} onClose={() => setAddOpen(false)} onAdd={addService} />

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        vault={vault}
        theme={theme}
        onTheme={setTheme}
        onGoTab={setTab}
        onScan={() => setScanOpen(true)}
        onAddService={() => setAddOpen(true)}
        onIncident={() => setIncidentOpen(true)}
        onReport={handleReport}
        onExport={handleExport}
        onToggleService={(id) => {
          const s = vault.services.find((x) => x.id === id);
          setStatus(id, s?.status === "done" ? "pending" : "done");
        }}
      />
      <ShortcutSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />

      {/* incident lane */}
      <Modal
        open={incidentOpen}
        onClose={() => setIncidentOpen(false)}
        title="Incident lane — SIM lost or stolen"
        subtitle="Emergency order of operations. Block the line before you fix anything else."
        wide
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-flare-500/30 bg-flare-500/10 px-4 py-3">
            <p className="text-xs font-semibold leading-relaxed text-paper">
              An active SIM in someone else's hands can receive UPI OTPs within minutes. Work top to bottom, in order —
              and keep every reference number you are given.
            </p>
          </div>

          <Progress value={vault.incident.done.length / INCIDENT_STEPS.length} tone="flare" />

          <div className="space-y-1.5">
            {INCIDENT_STEPS.map((s, i) => {
              const done = vault.incident.done.includes(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => toggleIncident(s.id)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
                    done ? "border-mint-500/20 bg-mint-500/5" : "border-line bg-ink-900/50 hover:border-ink-600",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border font-mono text-[11px] font-bold",
                      done ? "border-mint-500 bg-mint-500 text-ink-950" : "border-ink-600 text-faint",
                    )}
                  >
                    {done ? "✓" : i + 1}
                  </span>
                  <span className="min-w-0">
                    <span className={cn("flex flex-wrap items-center gap-2 text-sm font-bold", done ? "text-mist line-through" : "text-paper")}>
                      {s.title}
                      {s.window && (
                        <span className="rounded border border-flare-500/25 bg-flare-500/10 px-1.5 py-px font-mono text-[9px] font-semibold uppercase text-flare-300">
                          {s.window}
                        </span>
                      )}
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-mist">{s.detail}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line-soft bg-ink-900/50 px-4 py-3">
            <div>
              <p className="text-xs font-bold text-paper">Flag this vault as an incident</p>
              <p className="text-[11px] text-faint">Escalates exposure messaging on the dashboard and in the report</p>
            </div>
            <Button
              size="sm"
              variant={vault.incident.active ? "danger" : "outline"}
              onClick={() => setIncidentActive(!vault.incident.active)}
            >
              {vault.incident.active ? "Incident active — clear flag" : "Mark as incident"}
            </Button>
          </div>

          <Button
            className="w-full"
            variant="outline"
            onClick={() => {
              setIncidentOpen(false);
              handleReport();
            }}
            icon={<FileJson size={14} />}
          >
            Download incident + migration report
          </Button>
        </div>
      </Modal>

      <Modal open={confirm !== null} onClose={() => setConfirm(null)} title={confirm?.title ?? ""}>
        {confirm && (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-mist">{confirm.body}</p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setConfirm(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={() => {
                  confirm.action();
                  setConfirm(null);
                }}
              >
                {confirm.label}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Toasts toasts={toasts} dismiss={dismiss} />
    </div>
  );
}



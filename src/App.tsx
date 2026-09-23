import { AnimatePresence, motion } from "framer-motion";
import {
  FileJson,
  ListChecks,
  LayoutDashboard,
  Menu,
  MessageSquareText,
  Radar,
  ScanLine,
  ShieldCheck,
  TimerReset,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { cn } from "./utils/cn";
import { CATALOG } from "./data/services";
import {
  createVault,
  daysUntilRecycle,
  deleteVault as removeVault,
  exportVault,
  fmtPhone,
  loadActive,
  loadIndex,
  loadVault,
  parseImportedVault,
  riskReport,
  saveActive,
  saveVault,
  scoreLabel,
  urgencyOf,
  uid,
} from "./lib/storage";
import type { Category, Service, TaskStatus, TabId, Vault } from "./types";
import { AddServiceModal, Checklist, ScanModal } from "./components/Checklist";
import { Dashboard } from "./components/Dashboard";
import { Broadcaster } from "./components/Broadcaster";
import { Sidebar } from "./components/Sidebar";
import { SpecView } from "./components/SpecView";
import { UpiProtocol } from "./components/UpiProtocol";
import { VaultGate, type VaultMeta } from "./components/VaultGate";
import { Button, Modal, Toasts, type Toast } from "./components/ui";

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

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={14} /> },
  { id: "checklist", label: "Checklist", icon: <ListChecks size={14} /> },
  { id: "upi", label: "UPI Protocol", icon: <ShieldCheck size={14} /> },
  { id: "broadcast", label: "Broadcaster", icon: <MessageSquareText size={14} /> },
  { id: "spec", label: "Spec", icon: <FileJson size={14} /> },
];

export default function App() {
  const [vaultsMeta, setVaultsMeta] = useState<VaultMeta[]>([]);
  const [vault, setVault] = useState<Vault | null>(null);
  const [tab, setTab] = useState<TabId>("dashboard");
  const [drawer, setDrawer] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [confirm, setConfirm] = useState<null | { title: string; body: string; label: string; action: () => void }>(null);
  const { toasts, toast, dismiss } = useToasts();

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
    const p = loadActive();
    if (p) {
      const v = loadVault(p);
      if (v) setVault(v);
    }
  }, [refreshMeta]);

  const mutate = useCallback(
    (fn: (v: Vault) => Vault) => {
      setVault((prev) => {
        if (!prev) return prev;
        const next = saveVault(fn(prev));
        return next;
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

  const handleCreateVault = (phone: string, newNumber?: string) => {
    const v = createVault(phone, newNumber);
    setVault(v);
    saveActive(phone);
    setTab("dashboard");
    toast("Vault created — run your first scan", "mint");
  };

  const askDeleteVault = (phone: string) => {
    setConfirm({
      title: `Delete vault ${fmtPhone(phone)}?`,
      body: "This permanently removes the checklist, contacts and protocol progress from this browser. Consider exporting a JSON backup first.",
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
    mutate((v) => ({
      ...v,
      services: v.services.map((s) => (s.id === id ? { ...s, status, doneAt: status === "done" ? Date.now() : s.doneAt } : s)),
    }));
    if (svc && status === "done") toast(`${svc.name} marked done — exposure down`, "mint");
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

  const addService = (data: { name: string; category: Category; risk: Service["risk"]; url: string; isUpi: boolean; steps: string[] }) => {
    if (vault?.services.some((s) => s.name.toLowerCase() === data.name.toLowerCase())) {
      toast(`${data.name} is already in the vault`, "gold");
      return;
    }
    const svc: Service = { ...data, id: uid(), status: "pending", stepDone: data.steps.map(() => false), custom: true, addedAt: Date.now() };
    mutate((v) => ({ ...v, services: [...v.services, svc] }));
    toast(`${data.name} added to the checklist`, "mint");
  };

  const deleteService = (id: string) => {
    const svc = vault?.services.find((s) => s.id === id);
    mutate((v) => ({ ...v, services: v.services.filter((s) => s.id !== id) }));
    if (svc) toast(`${svc.name} removed`, "sky");
  };

  const runScan = (cats: Category[]) => {
    const tracked = new Set((vault?.services ?? []).map((s) => s.name.toLowerCase()));
    const adding = CATALOG.filter((c) => cats.includes(c.category) && !tracked.has(c.name.toLowerCase()));
    mutate((v) => ({ ...v, services: [...v.services, ...adding.map(toService)] }));
    if (adding.length > 0) toast(`Scan added ${adding.length} services`, "mint");
    else toast("Nothing new — catalog fully covered", "sky");
    setTab("checklist");
  };

  /* ---------------- vpa / contacts / meta ---------------- */

  const toggleVpa = (stepId: string) =>
    mutate((v) => {
      const done = v.vpaDone ?? [];
      return { ...v, vpaDone: done.includes(stepId) ? done.filter((x) => x !== stepId) : [...done, stepId] };
    });

  const addContact = (name: string, number: string) => {
    if (vault?.contacts.some((c) => c.number === number)) {
      toast(`${name} is already in the contact list`, "gold");
      return;
    }
    mutate((v) => ({ ...v, contacts: [...v.contacts, { id: uid(), name, number, notified: false }] }));
    toast(`${name} added to the broadcast list`, "mint");
  };

  const deleteContact = (id: string) => mutate((v) => ({ ...v, contacts: v.contacts.filter((c) => c.id !== id) }));
  const toggleNotified = (id: string) =>
    mutate((v) => ({ ...v, contacts: v.contacts.map((c) => (c.id === id ? { ...c, notified: !c.notified } : c)) }));

  const setDropDate = (iso: string) => {
    mutate((v) => ({ ...v, simDropDate: iso }));
    toast("Recycle clock updated", "sky");
  };
  const setNewNumber = (n: string) => mutate((v) => ({ ...v, newNumber: n || undefined }));
  const setTemplate = (t: string) => mutate((v) => ({ ...v, messageTemplate: t }));

  /* ---------------- data in/out ---------------- */

  const handleExport = () => {
    if (!vault) return;
    exportVault(vault);
    toast("Vault JSON downloaded", "mint");
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

  /* ---------------- derived ---------------- */

  if (!vault) {
    return (
      <>
        <VaultGate vaults={vaultsMeta} onOpen={openVault} onCreate={handleCreateVault} />
        <Toasts toasts={toasts} dismiss={dismiss} />
      </>
    );
  }

  const daysLeft = daysUntilRecycle(vault.simDropDate);
  const exposure = riskReport(vault.services).score;
  const urgency = urgencyOf(daysLeft, exposure);
  const sl = scoreLabel(exposure);
  const pendingUpi = vault.services.filter((s) => s.isUpi && s.status !== "done" && s.status !== "skipped").length;
  const unnotified = vault.contacts.filter((c) => !c.notified).length;

  const pillTone =
    urgency === "critical" || urgency === "missed"
      ? "border-flare-500/40 bg-flare-500/10 text-flare-300"
      : urgency === "warning"
        ? "border-gold-400/40 bg-gold-400/10 text-gold-300"
        : "border-mint-500/30 bg-mint-500/10 text-mint-300";

  return (
    <div className="flex min-h-screen bg-ink-950">
      {/* desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-line-soft bg-ink-900/50 lg:block">
        <Sidebar
          vault={vault}
          vaults={vaultsMeta}
          exposure={exposure}
          daysLeft={daysLeft}
          onSelect={openVault}
          onNew={() => {
            setVault(null);
            saveActive(null);
          }}
          onDeleteVault={askDeleteVault}
          onExport={handleExport}
          onImport={handleImport}
          onOpenSpec={() => setTab("spec")}
        />
      </aside>

      {/* mobile drawer */}
      <AnimatePresence>
        {drawer && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-ink-950/70 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawer(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 w-75 border-r border-line bg-ink-900 lg:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
            >
              <button
                onClick={() => setDrawer(false)}
                className="absolute right-3 top-3 z-10 rounded-md p-1.5 text-mist hover:bg-ink-700 hover:text-paper"
                aria-label="Close menu"
              >
                <X size={16} />
              </button>
              <Sidebar
                vault={vault}
                vaults={vaultsMeta}
                exposure={exposure}
                daysLeft={daysLeft}
                onSelect={openVault}
                onNew={() => {
                  setDrawer(false);
                  setVault(null);
                  saveActive(null);
                }}
                onDeleteVault={askDeleteVault}
                onExport={handleExport}
                onImport={handleImport}
                onOpenSpec={() => {
                  setDrawer(false);
                  setTab("spec");
                }}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-line-soft bg-ink-950/85 backdrop-blur">
          <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
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
                    className={cn(
                      "relative flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition-colors",
                      tab === t.id ? "border border-line bg-ink-800 text-paper" : "border border-transparent text-faint hover:text-mist",
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
              className={cn("hidden items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[11px] font-bold md:flex", pillTone)}
              title={`Exposure ${exposure ?? "—"}% · ${sl.text}`}
            >
              <TimerReset size={12} />
              {daysLeft < 0 ? "window missed" : `${daysLeft}d to recycle`}
              {exposure !== null && <span className="opacity-70">· {exposure}%</span>}
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
                    onGoChecklist={() => setTab("checklist")}
                    onGoUpi={() => setTab("upi")}
                    onGoBroadcast={() => setTab("broadcast")}
                  />
                )}
                {tab === "checklist" && (
                  <Checklist
                    vault={vault}
                    onStatus={setStatus}
                    onToggleStep={toggleStep}
                    onDelete={deleteService}
                    onOpenScan={() => setScanOpen(true)}
                    onOpenAdd={() => setAddOpen(true)}
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
                    onDeleteContact={deleteContact}
                    onToggleNotified={toggleNotified}
                    notify={toast}
                  />
                )}
                {tab === "spec" && <SpecView />}
              </motion.div>
            </AnimatePresence>
            <p className="mt-8 flex items-center justify-center gap-1.5 pb-4 text-center font-mono text-[10px] text-faint">
              <ScanLine size={10} className="text-mint-500" />
              NumberGuard v2 · local-only · your data never leaves this browser
            </p>
          </div>
        </main>
      </div>

      {/* modals */}
      <ScanModal open={scanOpen} onClose={() => setScanOpen(false)} vault={vault} onScan={runScan} />
      <AddServiceModal open={addOpen} onClose={() => setAddOpen(false)} onAdd={addService} />
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

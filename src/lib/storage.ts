import type { Activity, ActivityKind, Contact, RiskLevel, Service, Snapshot, Theme, Vault } from "../types";
import { CATEGORIES, RISK_WEIGHT } from "../types";
import { MILESTONES, RISK_ORDER } from "../data/plan";

const INDEX_KEY = "ng.vaults";
const ACTIVE_KEY = "ng.active";
const THEME_KEY = "ng.theme";
const vaultKey = (phone: string) => `ng.vault.${phone}`;

export const uid = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

/* ---------------- phones ---------------- */

export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
  return digits.slice(-10);
}

export function isValidIndianMobile(digits: string): boolean {
  return /^\d{10}$/.test(digits) && /^[6-9]/.test(digits);
}

export function fmtPhone(digits: string): string {
  if (!isValidIndianMobile(digits)) return digits;
  return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
}

/* ---------------- theme ---------------- */

export function loadTheme(): Theme {
  return localStorage.getItem(THEME_KEY) === "light" ? "light" : "dark";
}

export function saveTheme(t: Theme): void {
  localStorage.setItem(THEME_KEY, t);
}

/* ---------------- vault index ---------------- */

export function loadIndex(): string[] {
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    const arr = raw ? (JSON.parse(raw) as string[]) : [];
    return Array.isArray(arr) ? arr.filter((p) => isValidIndianMobile(p)) : [];
  } catch {
    return [];
  }
}

export function saveIndex(phoneList: string[]): void {
  localStorage.setItem(INDEX_KEY, JSON.stringify(phoneList));
}

export function addPhoneToIndex(phone: string): void {
  const idx = loadIndex();
  if (!idx.includes(phone)) {
    idx.push(phone);
    saveIndex(idx);
  }
}

export function removePhoneFromIndex(phone: string): void {
  saveIndex(loadIndex().filter((p) => p !== phone));
}

export function loadActive(): string | null {
  const a = localStorage.getItem(ACTIVE_KEY);
  return a && isValidIndianMobile(a) ? a : null;
}

export function saveActive(phone: string | null): void {
  if (phone) localStorage.setItem(ACTIVE_KEY, phone);
  else localStorage.removeItem(ACTIVE_KEY);
}

/* ---------------- schema migration ---------------- */

function normalizeService(raw: Partial<Service>): Service {
  const steps = Array.isArray(raw.steps) ? raw.steps : [];
  const stepDone = Array.isArray(raw.stepDone) ? steps.map((_, i) => Boolean(raw.stepDone?.[i])) : steps.map(() => false);
  const status = (["pending", "in_progress", "done", "skipped"] as const).includes(raw.status as never)
    ? (raw.status as Service["status"])
    : "pending";
  return {
    id: raw.id ?? uid(),
    name: raw.name ?? "Unnamed service",
    category: (CATEGORIES as readonly string[]).includes(raw.category as string)
      ? (raw.category as Service["category"])
      : "Lifestyle",
    risk: (RISK_ORDER as string[]).includes(raw.risk as string) ? (raw.risk as RiskLevel) : "medium",
    isUpi: Boolean(raw.isUpi),
    url: raw.url ?? "",
    steps,
    stepDone,
    notes: raw.notes,
    status,
    custom: raw.custom,
    addedAt: raw.addedAt ?? Date.now(),
    doneAt: raw.doneAt,
  };
}

function normalizeVault(raw: any, phone: string): Vault {
  return {
    phone,
    newNumber: isValidIndianMobile(String(raw?.newNumber ?? "")) ? String(raw.newNumber) : undefined,
    simDropDate: typeof raw?.simDropDate === "string" && raw.simDropDate ? raw.simDropDate : toISODate(new Date()),
    services: Array.isArray(raw?.services) ? raw.services.map(normalizeService) : [],
    contacts: Array.isArray(raw?.contacts)
      ? raw.contacts
          .filter((c: any) => c && isValidIndianMobile(String(c.number ?? "")))
          .map((c: any): Contact => ({
            id: c.id ?? uid(),
            name: String(c.name ?? "Contact"),
            number: String(c.number),
            group: ["Family", "Work", "Finance", "Other"].includes(c.group) ? c.group : "Other",
            notified: Boolean(c.notified),
          }))
      : [],
    messageTemplate: typeof raw?.messageTemplate === "string" ? raw.messageTemplate : undefined,
    vpaDone: Array.isArray(raw?.vpaDone) ? raw.vpaDone.map(String) : [],
    activity: Array.isArray(raw?.activity)
      ? raw.activity
          .filter((a: any) => a && typeof a.text === "string")
          .map((a: any): Activity => ({ id: a.id ?? uid(), at: a.at ?? Date.now(), kind: a.kind ?? "status", text: a.text }))
          .slice(0, 200)
      : [],
    snapshots: Array.isArray(raw?.snapshots)
      ? raw.snapshots
          .filter((s: any) => s && typeof s.date === "string")
          .map((s: any): Snapshot => ({ date: s.date, exposure: Number(s.exposure) || 0, done: Number(s.done) || 0, total: Number(s.total) || 0 }))
          .slice(-120)
      : [],
    incident: { active: Boolean(raw?.incident?.active), done: Array.isArray(raw?.incident?.done) ? raw.incident.done.map(String) : [] },
    createdAt: raw?.createdAt ?? Date.now(),
    updatedAt: raw?.updatedAt ?? Date.now(),
  };
}

/* ---------------- vaults ---------------- */

export function loadVault(phone: string): Vault | null {
  try {
    const raw = localStorage.getItem(vaultKey(phone));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.phone !== phone) return null;
    return normalizeVault(parsed, phone);
  } catch {
    return null;
  }
}

export function saveVault(v: Vault): Vault {
  const next = { ...v, updatedAt: Date.now() };
  localStorage.setItem(vaultKey(v.phone), JSON.stringify(next));
  addPhoneToIndex(v.phone);
  return next;
}

export function deleteVault(phone: string): void {
  localStorage.removeItem(vaultKey(phone));
  removePhoneFromIndex(phone);
}

export function createVault(phone: string, newNumber?: string, simDropDate?: string): Vault {
  const now = Date.now();
  const base: Vault = {
    phone,
    newNumber: newNumber && isValidIndianMobile(newNumber) ? newNumber : undefined,
    simDropDate: simDropDate ?? toISODate(new Date()),
    services: [],
    contacts: [],
    vpaDone: [],
    activity: [{ id: uid(), at: now, kind: "created", text: `Vault created for ${fmtPhone(phone)}` }],
    snapshots: [],
    incident: { active: false, done: [] },
    createdAt: now,
    updatedAt: now,
  };
  return saveVault(recordSnapshot(base));
}

export function exportVault(v: Vault): void {
  const blob = new Blob([JSON.stringify({ app: "numberguard", version: 3, vault: v }, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `numberguard-${v.phone}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function parseImportedVault(file: File): Promise<Vault> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.onload = () => {
      try {
        const json = JSON.parse(String(reader.result));
        const raw = json?.vault ?? json;
        if (!raw || !isValidIndianMobile(String(raw.phone ?? "")) || !Array.isArray(raw.services)) {
          reject(new Error("Not a valid NumberGuard vault file"));
          return;
        }
        const v = normalizeVault(raw, String(raw.phone));
        resolve(saveVault({ ...v, activity: [logEntry("data", "Vault imported from JSON"), ...v.activity].slice(0, 200) }));
      } catch {
        reject(new Error("Invalid JSON file"));
      }
    };
    reader.readAsText(file);
  });
}

/* ---------------- activity ---------------- */

export function logEntry(kind: ActivityKind, text: string): Activity {
  return { id: uid(), at: Date.now(), kind, text };
}

export function withLog(v: Vault, kind: ActivityKind, text: string): Vault {
  return { ...v, activity: [logEntry(kind, text), ...v.activity].slice(0, 200) };
}

export function fmtActivityTime(at: number): string {
  const d = new Date(at);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  if (sameDay) return `today ${time}`;
  const yest = new Date(today.getTime() - 86_400_000);
  if (d.toDateString() === yest.toDateString()) return `yesterday ${time}`;
  return `${d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}, ${time}`;
}

/* ---------------- dates & recycle math ---------------- */

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const DAY_MS = 86_400_000;

export function recycleDeadline(simDropDate: string): Date {
  return new Date(new Date(`${simDropDate}T00:00:00`).getTime() + 90 * DAY_MS);
}

export function daysUntilRecycle(simDropDate: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((recycleDeadline(simDropDate).getTime() - now.getTime()) / DAY_MS);
}

export function daysSince(ts: number): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const then = new Date(ts);
  then.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((now.getTime() - then.getTime()) / DAY_MS));
}

export type Urgency = "calm" | "warning" | "critical" | "missed" | "cleared";

export function urgencyOf(daysLeft: number, exposure: number | null): Urgency {
  if (exposure === 0) return "cleared";
  if (daysLeft < 0) return "missed";
  if (daysLeft <= 14) return "critical";
  if (daysLeft <= 45) return "warning";
  return "calm";
}

export function fmtDateLong(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/* ---------------- risk math ---------------- */

export interface RiskReport {
  score: number | null;
  total: number;
  remaining: number;
  doneCount: number;
  skippedCount: number;
  pendingCount: number;
  totalCount: number;
  byCategory: { category: string; done: number; total: number }[];
  byRisk: { risk: RiskLevel; remaining: number; total: number }[];
  topPending: Service[];
}

export function riskReport(services: Service[]): RiskReport {
  const active = services.filter((s) => s.status !== "skipped");
  const total = active.reduce((sum, s) => sum + RISK_WEIGHT[s.risk], 0);
  const remaining = active.filter((s) => s.status !== "done").reduce((sum, s) => sum + RISK_WEIGHT[s.risk], 0);

  const counts = { done: 0, skipped: 0, pending: 0 };
  for (const s of services) {
    if (s.status === "done") counts.done++;
    else if (s.status === "skipped") counts.skipped++;
    else counts.pending++;
  }

  const cats = new Map<string, { done: number; total: number }>();
  for (const s of services) {
    const c = cats.get(s.category) ?? { done: 0, total: 0 };
    c.total++;
    if (s.status === "done" || s.status === "skipped") c.done++;
    cats.set(s.category, c);
  }

  const byRisk = RISK_ORDER.map((risk) => ({
    risk,
    remaining: active.filter((s) => s.risk === risk && s.status !== "done").reduce((n) => n + RISK_WEIGHT[risk], 0),
    total: active.filter((s) => s.risk === risk).reduce((n) => n + RISK_WEIGHT[risk], 0),
  }));

  const topPending = services
    .filter((s) => s.status !== "done" && s.status !== "skipped")
    .sort((a, b) => RISK_ORDER.indexOf(a.risk) - RISK_ORDER.indexOf(b.risk) || b.addedAt - a.addedAt)
    .slice(0, 4);

  return {
    score: total === 0 ? null : Math.round((remaining / total) * 100),
    total,
    remaining,
    doneCount: counts.done,
    skippedCount: counts.skipped,
    pendingCount: counts.pending,
    totalCount: services.length,
    byCategory: CATEGORIES.filter((c) => cats.has(c)).map((c) => ({ category: c, ...cats.get(c)! })),
    byRisk,
    topPending,
  };
}

export function scoreLabel(score: number | null): { text: string; tone: "none" | "mint" | "gold" | "flare" | "sky" } {
  if (score === null) return { text: "No baseline", tone: "none" };
  if (score === 0) return { text: "Cleared", tone: "mint" };
  if (score >= 70) return { text: "Critical exposure", tone: "flare" };
  if (score >= 40) return { text: "Elevated exposure", tone: "gold" };
  if (score >= 15) return { text: "Moderate exposure", tone: "sky" };
  return { text: "Low exposure", tone: "mint" };
}

/* ---------------- snapshots (trend) ---------------- */

export function recordSnapshot(v: Vault): Vault {
  const rep = riskReport(v.services);
  const today = toISODate(new Date());
  const entry: Snapshot = {
    date: today,
    exposure: rep.score ?? 0,
    done: rep.doneCount + rep.skippedCount,
    total: rep.totalCount,
  };
  const others = v.snapshots.filter((s) => s.date !== today);
  const snapshots = [...others, entry].sort((a, b) => a.date.localeCompare(b.date)).slice(-120);
  return { ...v, snapshots };
}

/* ---------------- milestones ---------------- */

export interface MilestoneState {
  id: string;
  code: string;
  title: string;
  from: number;
  to: number;
  focus: string;
  summary: string;
  doneCount: number;
  totalCount: number;
  complete: boolean;
  state: "upcoming" | "due" | "overdue" | "done" | "ahead";
  daysLabel: string;
  openItems: Service[];
}

export function milestoneStates(vault: Vault, daysLeft: number): MilestoneState[] {
  const offset = 90 - daysLeft; // days since the SIM was dropped
  const relevant = (id: string): Service[] => {
    const m = MILESTONES.find((x) => x.id === id)!;
    if (m.critOnly) return vault.services.filter((s) => s.risk === "critical");
    if (m.cats.length > 0) return vault.services.filter((s) => m.cats.includes(s.category));
    return vault.services;
  };
  const finalExtras = () => {
    const extras: string[] = [];
    if (!vault.newNumber) extras.push("new number not saved");
    if (vault.contacts.length > 0 && vault.contacts.some((c) => !c.notified)) extras.push("contacts not notified");
    return extras;
  };

  return MILESTONES.map((m) => {
    const items = relevant(m.id);
    const closed = (s: Service) => s.status === "done" || s.status === "skipped";
    const doneCount = items.filter(closed).length;
    let complete = items.length > 0 && doneCount === items.length;
    let extraNote = "";
    if (m.id === "m5") {
      const extras = finalExtras();
      complete = complete && extras.length === 0;
      extraNote = extras.length > 0 ? ` · ${extras.join(" · ")}` : "";
    }
    let state: MilestoneState["state"];
    if (complete) state = "done";
    else if (offset > m.to) state = "overdue";
    else if (offset >= m.from) state = "due";
    else if (offset < m.from) state = "upcoming";
    else state = "ahead";
    const daysLabel =
      state === "overdue"
        ? `${offset - m.to}d past window`
        : state === "due"
          ? `due now · closes in ${m.to - offset}d`
          : state === "upcoming"
            ? `starts in ${m.from - offset}d`
            : `day ${m.from}–${m.to}`;
    return {
      ...m,
      doneCount,
      totalCount: items.length,
      complete,
      state,
      daysLabel: extraNote ? `${daysLabel}${extraNote}` : daysLabel,
      openItems: items.filter((s) => !closed(s)).slice(0, 5),
    };
  });
}

/* ---------------- markdown report ---------------- */

export function buildReport(vault: Vault): string {
  const rep = riskReport(vault.services);
  const daysLeft = daysUntilRecycle(vault.simDropDate);
  const ms = milestoneStates(vault, daysLeft);
  const lines: string[] = [];
  const row = (...cells: string[]) => `| ${cells.join(" | ")} |`;

  lines.push(`# NumberGuard migration report`);
  lines.push("");
  lines.push(`Generated: ${new Date().toLocaleString("en-IN")}`);
  lines.push(`Old number: **${fmtPhone(vault.phone)}**  ·  New number: ${vault.newNumber ? `**${fmtPhone(vault.newNumber)}**` : "_not set_"}`);
  lines.push(`SIM drop date: ${fmtDateLong(vault.simDropDate)}  ·  Recycle deadline: ${fmtDateLong(toISODate(recycleDeadline(vault.simDropDate)))}  ·  **${Math.max(0, daysLeft)} days left**`);
  lines.push("");
  lines.push(`## Summary`);
  lines.push("");
  lines.push("| Metric | Value |");
  lines.push("| --- | --- |");
  lines.push(row("Exposure score", rep.score === null ? "n/a" : `${rep.score}% (${scoreLabel(rep.score).text})`));
  lines.push(row("Services tracked", `${rep.totalCount}`));
  lines.push(row("Cleared / open / not-applicable", `${rep.doneCount} / ${rep.pendingCount} / ${rep.skippedCount}`));
  lines.push(row("UPI protocol", `${vault.vpaDone.length}/5 steps`));
  lines.push(row("Incident lane", vault.incident.active ? `active (${vault.incident.done.length}/6 steps)` : "not active"));
  lines.push(row("Contacts notified", `${vault.contacts.filter((c) => c.notified).length}/${vault.contacts.length}`));
  lines.push("");

  lines.push("## Progress by category");
  lines.push("");
  lines.push("| Category | Cleared | Tracked |");
  lines.push("| --- | --- | --- |");
  for (const c of rep.byCategory) lines.push(row(c.category, `${c.done}`, `${c.total}`));
  lines.push("");

  lines.push("## Open services");
  lines.push("");
  const open = vault.services.filter((s) => s.status !== "done" && s.status !== "skipped").sort((a, b) => RISK_ORDER.indexOf(a.risk) - RISK_ORDER.indexOf(b.risk));
  if (open.length === 0) lines.push("_None — every tracked service is closed._");
  else {
    lines.push("| Risk | Service | Category | Status | Steps |");
    lines.push("| --- | --- | --- | --- | --- |");
    for (const s of open)
      lines.push(row(s.risk.toUpperCase(), s.name, s.category, s.status.replace("_", " "), `${s.stepDone.filter(Boolean).length}/${s.steps.length}`));
  }
  lines.push("");

  lines.push("## Milestone plan");
  lines.push("");
  lines.push("| Milestone | Window (day) | State | Progress |");
  lines.push("| --- | --- | --- | --- |");
  for (const m of ms) lines.push(row(`${m.code} ${m.title}`, `${m.from}–${m.to}`, m.complete ? "complete" : m.state, `${m.doneCount}/${m.totalCount}`));
  lines.push("");

  lines.push("## Activity log (latest 40)");
  lines.push("");
  if (vault.activity.length === 0) lines.push("_No activity recorded._");
  else for (const a of vault.activity.slice(0, 40)) lines.push(`- **${fmtActivityTime(a.at)}** — ${a.text}`);
  lines.push("");
  lines.push("---");
  lines.push("_Generated locally by NumberGuard. No data left this browser._");
  return lines.join("\n");
}

export function downloadReport(vault: Vault): void {
  const blob = new Blob([buildReport(vault)], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `numberguard-report-${vault.phone}-${toISODate(new Date())}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Blank-line helpers so reports always end cleanly. */
export const REPORT_FOOTER = "Generated locally by NumberGuard. No data left this browser.";

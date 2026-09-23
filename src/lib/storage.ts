import type { RiskLevel, Service, Vault } from "../types";
import { RISK_WEIGHT } from "../types";

const INDEX_KEY = "ng.vaults";
const ACTIVE_KEY = "ng.active";
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

/* ---------------- vaults ---------------- */

export function loadVault(phone: string): Vault | null {
  try {
    const raw = localStorage.getItem(vaultKey(phone));
    if (!raw) return null;
    const v = JSON.parse(raw) as Vault;
    if (v.phone !== phone || !Array.isArray(v.services)) return null;
    return v;
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

export function createVault(phone: string, newNumber?: string): Vault {
  const v: Vault = {
    phone,
    newNumber: newNumber && isValidIndianMobile(newNumber) ? newNumber : undefined,
    simDropDate: toISODate(new Date()),
    services: [],
    contacts: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  return saveVault(v);
}

export function exportVault(v: Vault): void {
  const blob = new Blob([JSON.stringify({ app: "numberguard", version: 2, vault: v }, null, 2)], {
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
        const v = (json?.vault ?? json) as Vault;
        if (!v || typeof v.phone !== "string" || !isValidIndianMobile(v.phone) || !Array.isArray(v.services)) {
          reject(new Error("Not a valid NumberGuard vault file"));
          return;
        }
        resolve(saveVault(v));
      } catch {
        reject(new Error("Invalid JSON file"));
      }
    };
    reader.readAsText(file);
  });
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
  const base = new Date(`${simDropDate}T00:00:00`);
  return new Date(base.getTime() + 90 * DAY_MS);
}

export function daysUntilRecycle(simDropDate: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((recycleDeadline(simDropDate).getTime() - now.getTime()) / DAY_MS);
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
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/* ---------------- risk math ---------------- */

export interface RiskReport {
  score: number | null; // 0..100 exposure, null when no tracked services
  total: number;
  remaining: number;
  doneCount: number;
  skippedCount: number;
  pendingCount: number;
  totalCount: number;
  byCategory: { category: string; done: number; total: number }[];
  topPending: Service[];
}

export function riskReport(services: Service[]): RiskReport {
  const active = services.filter((s) => s.status !== "skipped");
  const total = active.reduce((sum, s) => sum + RISK_WEIGHT[s.risk], 0);
  const remaining = active
    .filter((s) => s.status !== "done")
    .reduce((sum, s) => sum + RISK_WEIGHT[s.risk], 0);

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

  const order: RiskLevel[] = ["critical", "high", "medium", "low"];
  const topPending = services
    .filter((s) => s.status !== "done" && s.status !== "skipped")
    .sort((a, b) => order.indexOf(a.risk) - order.indexOf(b.risk) || b.addedAt - a.addedAt)
    .slice(0, 4);

  return {
    score: total === 0 ? null : Math.round((remaining / total) * 100),
    total,
    remaining,
    doneCount: counts.done,
    skippedCount: counts.skipped,
    pendingCount: counts.pending,
    totalCount: services.length,
    byCategory: [...cats.entries()].map(([category, v]) => ({ category, ...v })),
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

export const DEFAULT_MESSAGE =
  "Hi! Quick update — I'm switching SIMs. My old number {old} will stop working soon. Please save my new number: +91 {new}. Anything that still routes to the old one (UPI, banks, OTPs) needs updating on my end, so ping me on the new number. Thanks!";

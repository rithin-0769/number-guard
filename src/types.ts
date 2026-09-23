export type RiskLevel = "critical" | "high" | "medium" | "low";
export type TaskStatus = "pending" | "in_progress" | "done" | "skipped";

export const CATEGORIES = [
  "Identity",
  "Banking",
  "UPI",
  "Government",
  "Social",
  "Shopping",
  "Travel",
  "Lifestyle",
] as const;
export type Category = (typeof CATEGORIES)[number];

export interface CatalogService {
  name: string;
  category: Category;
  risk: RiskLevel;
  isUpi?: boolean;
  url: string;
  steps: string[];
}

export interface Service extends CatalogService {
  id: string;
  status: TaskStatus;
  stepDone: boolean[];
  custom?: boolean;
  addedAt: number;
  doneAt?: number;
}

export interface Contact {
  id: string;
  name: string;
  number: string; // 10 digits
  notified: boolean;
}

export interface Vault {
  phone: string; // 10 digits, the OLD number being dropped
  newNumber?: string; // 10 digits
  simDropDate: string; // yyyy-mm-dd — day the SIM goes inactive
  services: Service[];
  contacts: Contact[];
  messageTemplate?: string;
  vpaDone?: string[]; // completed ids of the global VPA protocol
  createdAt: number;
  updatedAt: number;
}

export type TabId = "dashboard" | "checklist" | "upi" | "broadcast" | "spec";

export const RISK_WEIGHT: Record<RiskLevel, number> = {
  critical: 25,
  high: 12,
  medium: 6,
  low: 2,
};

export const RISK_LABEL: Record<RiskLevel, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export const STATUS_LABEL: Record<TaskStatus, string> = {
  pending: "Pending",
  in_progress: "In progress",
  done: "Done",
  skipped: "Skipped",
};

import type { Category, RiskLevel } from "../types";

/* ---------------- message presets ---------------- */

export interface MessagePreset {
  id: string;
  name: string;
  hint: string;
  body: string;
}

export const MESSAGE_PRESETS: MessagePreset[] = [
  {
    id: "friendly",
    name: "Friendly",
    hint: "Default · friends & extended circle",
    body:
      "Hi! Quick update — I'm switching SIMs. My old number {old} will stop working soon. Please save my new number: +91 {new}. Anything still routed to the old one (UPI, banks, OTPs) is being updated on my end, so ping me on the new number. Thanks!",
  },
  {
    id: "formal",
    name: "Formal / Work",
    hint: "Colleagues, clients, official contacts",
    body:
      "Hello, this is to inform you that I am migrating from my old mobile number +91 {old} to a new number: +91 {new}. Kindly update your records and use the new number for all future communication. My old number will be deactivated shortly and may be reassigned. Apologies for the inconvenience.",
  },
  {
    id: "family",
    name: "Family / Brief",
    hint: "Short and unmistakable",
    body:
      "Amma/Appa/Anna — note my new number: +91 {new}. Old one ({old}) is going away. Save it and call me on this one from now on ❤️",
  },
];

/* ---------------- incident lane ---------------- */

export interface IncidentStep {
  id: string;
  title: string;
  detail: string;
  window?: string;
}

export const INCIDENT_STEPS: IncidentStep[] = [
  {
    id: "i1",
    title: "Block the SIM now",
    window: "first 30 minutes",
    detail:
      "Call your operator's helpline from any phone and ask for an immediate SIM block / suspension. Keep the complaint reference number (FRC) they give you — you will need it for the police complaint. Jio 199 · Airtel 198 · Vi 1991 · BSNL 1800 180 1503",
  },
  {
    id: "i2",
    title: "Freeze UPI, cards and netbanking",
    window: "same day",
    detail:
      "Call each bank's 24x7 number and ask to block UPI / debit-card e-commerce and SMS banking. Do this before anything else financial — a stolen SIM can receive UPI OTPs within minutes.",
  },
  {
    id: "i3",
    title: "Secure your critical accounts",
    window: "same day",
    detail:
      "From another device, sign in to Google, WhatsApp, email and primary bank. Sign out all sessions, remove the stolen number, re-verify 2FA onto an email or an alternate device.",
  },
  {
    id: "i4",
    title: "File the complaint",
    window: "within 24 hours",
    detail:
      "Report financial cyber-fraud at cybercrime.gov.in (the 24-hour golden window matters) and file a police FIR at your local station or via the e-FIR link. Attach the operator's FRC.",
  },
  {
    id: "i5",
    title: "Rebuild on the new number",
    window: "48–72 hours",
    detail:
      "Get a replacement SIM or a new number, re-verify the bank and email registrations, and re-link WhatsApp on the new number.",
  },
  {
    id: "i6",
    title: "Continue the standard migration",
    window: "thereafter",
    detail:
      "Work through the Checklist and UPI Protocol as normal. Any number left un-cleared stays exposed, incident or not.",
  },
];

/* ---------------- 90-day milestone plan ---------------- */

export interface MilestoneDef {
  id: string;
  code: string;
  title: string;
  from: number; // days after SIM drop date
  to: number;
  focus: string;
  cats: Category[];
  critOnly?: boolean;
  summary: string;
}

export const MILESTONES: MilestoneDef[] = [
  {
    id: "m1",
    code: "M1",
    title: "Freeze the bleeding",
    from: 0,
    to: 7,
    summary: "Close every Critical service — these are the ones that can empty an account or rewrite an identity.",
    focus: "critical services, UPI inventory",
    cats: [],
    critOnly: true,
  },
  {
    id: "m2",
    code: "M2",
    title: "Money rails",
    from: 8,
    to: 30,
    summary: "Finish Banking + UPI: registered mobiles, VPA migrations, mandates and salary routing.",
    focus: "banks & payment apps",
    cats: ["Banking", "UPI"],
  },
  {
    id: "m3",
    code: "M3",
    title: "Identity & government",
    from: 31,
    to: 60,
    summary: "Aadhaar, PAN and other government registrations — slow portals, start early.",
    focus: "Aadhaar, PAN, EPFO, DigiLocker",
    cats: ["Identity", "Government"],
  },
  {
    id: "m4",
    code: "M4",
    title: "Quiet the long tail",
    from: 61,
    to: 85,
    summary: "Social, shopping, travel and lifestyle apps — low blast radius, still worth closing.",
    focus: "social & consumer apps",
    cats: ["Social", "Shopping", "Travel", "Lifestyle"],
  },
  {
    id: "m5",
    code: "M5",
    title: "Final sweep",
    from: 86,
    to: 90,
    summary: "Everything closed, new number saved everywhere, contacts notified, then let the number go.",
    focus: "verification & handover",
    cats: [],
  },
];

export const RISK_ORDER: RiskLevel[] = ["critical", "high", "medium", "low"];

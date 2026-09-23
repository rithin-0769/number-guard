import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, MessageCircle, Plus, Trash2, UserPlus } from "lucide-react";
import { useState } from "react";
import { cn } from "../utils/cn";
import { DEFAULT_MESSAGE, fmtPhone, isValidIndianMobile, normalizePhone } from "../lib/storage";
import type { Contact, Vault } from "../types";
import { Button, Field, inputCls, Progress } from "./ui";

export function Broadcaster({
  vault,
  onSetNewNumber,
  onSetTemplate,
  onAddContact,
  onDeleteContact,
  onToggleNotified,
  notify,
}: {
  vault: Vault;
  onSetNewNumber: (n: string) => void;
  onSetTemplate: (t: string) => void;
  onAddContact: (name: string, number: string) => void;
  onDeleteContact: (id: string) => void;
  onToggleNotified: (id: string) => void;
  notify: (msg: string, tone?: "mint" | "flare" | "gold" | "sky" | "none") => void;
}) {
  const [name, setName] = useState("");
  const [num, setNum] = useState("");
  const newRaw = normalizePhone(num);
  const newOk = newRaw === "" || isValidIndianMobile(newRaw);

  const template = vault.messageTemplate ?? DEFAULT_MESSAGE;
  const rendered = template.split("{old}").join(vault.phone).split("{new}").join(vault.newNumber ?? "••••••••••");

  const insertToken = (t: string) => {
    const next = `${template} ${t}`;
    onSetTemplate(next);
  };

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      notify(`${label} copied to clipboard`, "mint");
    } catch {
      notify("Clipboard blocked by browser — copy manually", "flare");
    }
  };

  const addContact = () => {
    const n = normalizePhone(num);
    if (name.trim() === "" || !isValidIndianMobile(n)) return;
    onAddContact(name.trim(), n);
    setName("");
    setNum("");
  };

  const notified = vault.contacts.filter((c) => c.notified).length;

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
      {/* message composer */}
      <section className="space-y-4">
        <div className="rounded-2xl border border-line bg-ink-850 p-5">
          <h2 className="font-display text-sm font-semibold text-paper">Broadcast message</h2>
          <p className="mt-1 text-xs text-mist">
            Uses <span className="font-mono text-mint-300">{"{old}"}</span> and{" "}
            <span className="font-mono text-skyx-300">{"{new}"}</span> tokens — replaced with real numbers on send.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Old number" hint="auto">
              <div className={cn(inputCls, "font-mono tracking-wider text-mist")}>{fmtPhone(vault.phone)}</div>
            </Field>
            <Field label="New number" hint="saved to vault">
              <div className="flex items-stretch gap-2">
                <span className="flex items-center rounded-lg border border-line bg-ink-900 px-2.5 font-mono text-xs font-semibold text-mist">
                  +91
                </span>
                <input
                  className={`${inputCls} font-mono tracking-wider ${!newOk ? "border-flare-500/50" : ""}`}
                  placeholder="97XXXXXXXX"
                  inputMode="numeric"
                  maxLength={14}
                  value={num}
                  onChange={(e) => {
                    setNum(e.target.value.replace(/[^\d\s+]/g, ""));
                    const n = normalizePhone(e.target.value);
                    onSetNewNumber(isValidIndianMobile(n) ? n : "");
                  }}
                />
              </div>
              {!newOk && <p className="mt-1 text-[11px] font-medium text-flare-300">Not a valid Indian mobile</p>}
            </Field>
          </div>

          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-mist">Message</span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => insertToken("{old}")}
                  className="rounded border border-line px-1.5 py-0.5 font-mono text-[10px] text-mint-300 transition-colors hover:border-mint-500/40"
                >
                  {"{old}"}
                </button>
                <button
                  onClick={() => insertToken("{new}")}
                  className="rounded border border-line px-1.5 py-0.5 font-mono text-[10px] text-skyx-300 transition-colors hover:border-skyx-400/40"
                >
                  {"{new}"}
                </button>
              </div>
            </div>
            <textarea
              className={`${inputCls} min-h-32 resize-y`}
              value={template}
              onChange={(e) => onSetTemplate(e.target.value)}
            />
          </div>

          <div className="mt-3 flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => copy(rendered, "Message")} icon={<Copy size={14} />}>
              Copy message
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => copy(DEFAULT_MESSAGE, "Default message")} icon={<Check size={14} />}>
              Reset to default
            </Button>
          </div>
        </div>

        {/* live preview */}
        <div className="rounded-2xl border border-line bg-ink-850 p-5">
          <h2 className="font-display text-sm font-semibold text-paper">Preview</h2>
          <div
            className="mt-3 rounded-xl p-4"
            style={{
              background: "radial-gradient(circle at 20% 10%, #14231c 0%, #0b1512 55%)",
              backgroundImage:
                "radial-gradient(rgba(120,160,140,0.05) 1px, transparent 1px), radial-gradient(circle at 20% 10%, #14231c 0%, #0b1512 55%)",
              backgroundSize: "18px 18px, cover",
            }}
          >
            <div className="ml-auto max-w-[85%] rounded-xl rounded-tr-sm border border-[#1f2c24] bg-[#0d1f16] px-3.5 py-2.5 shadow">
              <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-[#d9e8df]">{rendered}</p>
              <p className="mt-1.5 text-right font-mono text-[9px] text-[#5d746a]">
                {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} ✓✓
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* contacts */}
      <section className="rounded-2xl border border-line bg-ink-850 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 font-display text-sm font-semibold text-paper">
            <UserPlus size={15} className="text-mist" /> Contact list
          </h2>
          {vault.contacts.length > 0 && (
            <span className="font-mono text-[11px] font-semibold text-mist">
              <span className={notified === vault.contacts.length ? "text-mint-300" : "text-gold-300"}>{notified}</span>/
              {vault.contacts.length} notified
            </span>
          )}
        </div>

        <div className="mt-3">
          <Progress value={vault.contacts.length === 0 ? 0 : notified / vault.contacts.length} tone={notified === vault.contacts.length && vault.contacts.length > 0 ? "mint" : "gold"} />
        </div>

        {/* add form */}
        <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <input className={inputCls} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="flex items-stretch gap-2">
            <span className="flex items-center rounded-lg border border-line bg-ink-900 px-2.5 font-mono text-xs font-semibold text-mist">
              +91
            </span>
            <input
              className={`${inputCls} font-mono tracking-wider ${num && !newOk ? "border-flare-500/50" : ""}`}
              placeholder="97XXXXXXXX"
              inputMode="numeric"
              maxLength={14}
              value={num}
              onChange={(e) => setNum(e.target.value.replace(/[^\d\s+]/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && addContact()}
            />
          </div>
          <Button onClick={addContact} disabled={name.trim() === "" || !isValidIndianMobile(newRaw)} icon={<Plus size={14} />}>
            Add
          </Button>
        </div>
        {num !== "" && !newOk && <p className="mt-1.5 text-[11px] font-medium text-flare-300">Not a valid 10-digit Indian mobile</p>}

        {/* list */}
        <div className="mt-4 space-y-1.5">
          <AnimatePresence>
            {vault.contacts.map((c: Contact) => (
              <motion.div
                key={c.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -16 }}
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-3.5 py-2.5 transition-colors",
                  c.notified ? "border-mint-500/20 bg-mint-500/[0.04]" : "border-line bg-ink-900/50",
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-xs font-bold",
                    c.notified ? "bg-mint-500/15 text-mint-300" : "bg-ink-700 text-mist",
                  )}
                >
                  {c.name.slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={cn("truncate text-sm font-bold", c.notified ? "text-mist" : "text-paper")}>{c.name}</p>
                  <p className="font-mono text-[11px] tracking-wider text-faint">{fmtPhone(c.number)}</p>
                </div>
                <button
                  onClick={() => onToggleNotified(c.id)}
                  className={cn(
                    "rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition-colors",
                    c.notified
                      ? "border-mint-500/30 bg-mint-500/10 text-mint-300"
                      : "border-line text-faint hover:border-ink-600 hover:text-mist",
                  )}
                >
                  {c.notified ? "Sent" : "Mark sent"}
                </button>
                <a
                  href={`https://wa.me/91${c.number}?text=${encodeURIComponent(rendered)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg bg-[#1f8a4c] px-3 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-[#249c57]"
                >
                  <MessageCircle size={12} /> Chat
                </a>
                <button
                  onClick={() => onDeleteContact(c.id)}
                  className="rounded-md p-1.5 text-faint transition-colors hover:bg-flare-500/10 hover:text-flare-300"
                  title="Remove contact"
                >
                  <Trash2 size={13} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          {vault.contacts.length === 0 && (
            <p className="rounded-xl border border-dashed border-line bg-ink-900/40 px-4 py-8 text-center text-xs text-faint">
              No contacts yet. Add the people who need your new number — each row becomes a one-tap WhatsApp chat with
              the message pre-filled.
            </p>
          )}
        </div>

        {vault.contacts.length > 0 && (
          <button
            onClick={() => copy(vault.contacts.map((c) => c.number).join(", "), "All numbers")}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-line px-3 py-2 text-[11px] font-bold text-mist transition-colors hover:border-ink-600 hover:text-paper"
          >
            <Copy size={12} /> Copy all numbers (CSV-ready)
          </button>
        )}
      </section>
    </div>
  );
}

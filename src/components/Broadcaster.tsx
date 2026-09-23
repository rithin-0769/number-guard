import { AnimatePresence, motion } from "framer-motion";
import { Check, ClipboardPaste, Copy, MessageCircle, Plus, Trash2, UserPlus, Wand2 } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "../utils/cn";
import { fmtPhone, isValidIndianMobile, normalizePhone } from "../lib/storage";
import { MESSAGE_PRESETS } from "../data/plan";
import type { Contact, ContactGroup, Vault } from "../types";
import { CONTACT_GROUPS } from "../types";
import { Button, Field, inputCls, Modal, Progress } from "./ui";

export function Broadcaster({
  vault,
  onSetNewNumber,
  onSetTemplate,
  onAddContact,
  onBulkAdd,
  onDeleteContact,
  onToggleNotified,
  notify,
}: {
  vault: Vault;
  onSetNewNumber: (n: string) => void;
  onSetTemplate: (t: string) => void;
  onAddContact: (name: string, number: string, group: ContactGroup) => void;
  onBulkAdd: (rows: { name: string; number: string; group: ContactGroup }[]) => void;
  onDeleteContact: (id: string) => void;
  onToggleNotified: (id: string) => void;
  notify: (msg: string, tone?: "mint" | "flare" | "gold" | "sky" | "none") => void;
}) {
  const [name, setName] = useState("");
  const [num, setNum] = useState("");
  const [group, setGroup] = useState<ContactGroup>("Other");
  const [filter, setFilter] = useState<"All" | ContactGroup>("All");
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");

  const newP = normalizePhone(num);
  const numOk = newP === "" || isValidIndianMobile(newP);

  const template = vault.messageTemplate ?? MESSAGE_PRESETS[0].body;
  const rendered = template.split("{old}").join(vault.phone).split("{new}").join(vault.newNumber ?? "••••••••••");
  const activePreset = MESSAGE_PRESETS.find((p) => p.body === template)?.id;

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      notify(`${label} copied to clipboard`, "mint");
    } catch {
      notify("Clipboard blocked by browser — copy manually", "flare");
    }
  };

  const add = () => {
    if (name.trim() === "" || !isValidIndianMobile(newP)) return;
    onAddContact(name.trim(), newP, group);
    setName("");
    setNum("");
  };

  const shown = useMemo(
    () => (filter === "All" ? vault.contacts : vault.contacts.filter((c) => c.group === filter)),
    [vault.contacts, filter],
  );
  const notified = vault.contacts.filter((c) => c.notified).length;
  const allDone = vault.contacts.length > 0 && notified === vault.contacts.length;

  const parsePaste = () => {
    const rows = pasteText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.split(/[,;\t]|\s{2,}/).map((p) => p.trim()).filter(Boolean);
        const nums = parts.filter((p) => normalizePhone(p).length === 10 && isValidIndianMobile(normalizePhone(p)));
        const names = parts.filter((p) => !nums.includes(p));
        const number = nums[0] ?? normalizePhone(line);
        const nm = names.join(" ").slice(0, 40) || "";
        return { name: nm, number, group };
      })
      .filter((r) => isValidIndianMobile(r.number));
    onBulkAdd(rows.map((r, i) => ({ ...r, name: r.name || `Contact ${i + 1}` })));
    setPasteText("");
    setPasteOpen(false);
  };

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      {/* composer */}
      <section className="space-y-4">
        <div className="rounded-2xl border border-line bg-ink-850 p-5">
          <h2 className="flex items-center gap-2 font-display text-sm font-semibold text-paper">
            <Wand2 size={15} className="text-mist" /> Broadcast message
          </h2>
          <p className="mt-1 text-xs text-mist">
            Tokens <span className="font-mono text-mint-300">{"{old}"}</span> and{" "}
            <span className="font-mono text-skyx-300">{"{new}"}</span> are replaced per recipient.
          </p>

          {/* presets */}
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {MESSAGE_PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => onSetTemplate(p.body)}
                className={cn(
                  "rounded-xl border px-3 py-2.5 text-left transition-colors",
                  activePreset === p.id ? "border-mint-500/40 bg-mint-500/10" : "border-line bg-ink-900/50 hover:border-ink-600",
                )}
              >
                <span className="flex items-center gap-1.5 text-xs font-bold text-paper">
                  {activePreset === p.id && <Check size={12} className="text-mint-400" strokeWidth={3} />}
                  {p.name}
                </span>
                <span className="mt-0.5 block text-[10px] leading-snug text-faint">{p.hint}</span>
              </button>
            ))}
          </div>

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
                  className={`${inputCls} font-mono tracking-wider ${!numOk ? "border-flare-500/50" : ""}`}
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
              {!numOk && <p className="mt-1 text-[11px] font-medium text-flare-300">Not a valid Indian mobile</p>}
            </Field>
          </div>

          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-mist">Message</span>
              <div className="flex gap-1.5">
                <button onClick={() => onSetTemplate(`${template} {old}`)} className="rounded border border-line px-1.5 py-0.5 font-mono text-[10px] text-mint-300 transition-colors hover:border-mint-500/40">
                  {"{old}"}
                </button>
                <button onClick={() => onSetTemplate(`${template} {new}`)} className="rounded border border-line px-1.5 py-0.5 font-mono text-[10px] text-skyx-300 transition-colors hover:border-skyx-400/40">
                  {"{new}"}
                </button>
              </div>
            </div>
            <textarea className={`${inputCls} min-h-28 resize-y`} value={template} onChange={(e) => onSetTemplate(e.target.value)} />
          </div>

          <div className="mt-3 flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => copy(rendered, "Message")} icon={<Copy size={14} />}>
              Copy message
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => onSetTemplate(MESSAGE_PRESETS[0].body)} icon={<Check size={14} />}>
              Reset
            </Button>
          </div>
        </div>

        {/* preview */}
        <div className="rounded-2xl border border-line bg-ink-850 p-5">
          <h2 className="font-display text-sm font-semibold text-paper">Preview</h2>
          <div className="mt-3 rounded-xl border border-[#1f2c24] bg-[#0b1512] p-4">
            <div className="ml-auto max-w-[88%] rounded-xl rounded-tr-sm border border-[#1f2c24] bg-[#0d1f16] px-3.5 py-2.5 shadow">
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
              <span className={allDone ? "text-mint-300" : "text-gold-300"}>{notified}</span>/{vault.contacts.length} notified
            </span>
          )}
        </div>

        <div className="mt-3">
          <Progress value={vault.contacts.length === 0 ? 0 : notified / vault.contacts.length} tone={allDone ? "mint" : "gold"} />
        </div>

        {/* add form */}
        <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_1.1fr_auto]">
          <input className={inputCls} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="flex items-stretch gap-2">
            <span className="flex items-center rounded-lg border border-line bg-ink-900 px-2.5 font-mono text-xs font-semibold text-mist">
              +91
            </span>
            <input
              className={`${inputCls} font-mono tracking-wider ${num && !numOk ? "border-flare-500/50" : ""}`}
              placeholder="97XXXXXXXX"
              inputMode="numeric"
              maxLength={14}
              value={num}
              onChange={(e) => setNum(e.target.value.replace(/[^\d\s+]/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && add()}
            />
          </div>
          <Button onClick={add} disabled={name.trim() === "" || !isValidIndianMobile(newP)} icon={<Plus size={14} />}>
            Add
          </Button>
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1.5">
            {CONTACT_GROUPS.map((g) => (
              <button
                key={g}
                onClick={() => setGroup(g)}
                className={cn(
                  "rounded-lg border px-2.5 py-1 text-[11px] font-bold transition-colors",
                  group === g ? "border-skyx-400/40 bg-skyx-400/10 text-skyx-300" : "border-line text-faint hover:text-mist",
                )}
              >
                {g}
              </button>
            ))}
          </div>
          <span className="text-[10px] text-faint">add as</span>
          <div className="ml-auto">
            <Button size="sm" variant="outline" onClick={() => setPasteOpen(true)} icon={<ClipboardPaste size={13} />}>
              Bulk paste
            </Button>
          </div>
        </div>

        {/* filter */}
        {vault.contacts.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5 border-t border-line-soft pt-3">
            {(["All", ...CONTACT_GROUPS] as const).map((g) => {
              const n = g === "All" ? vault.contacts.length : vault.contacts.filter((c) => c.group === g).length;
              if (n === 0) return null;
              return (
                <button
                  key={g}
                  onClick={() => setFilter(g)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors",
                    filter === g ? "border-mint-500/40 bg-mint-500/10 text-mint-300" : "border-line text-faint hover:text-mist",
                  )}
                >
                  {g} · {n}
                </button>
              );
            })}
          </div>
        )}

        {/* list */}
        <div className="mt-3 space-y-1.5">
          <AnimatePresence>
            {shown.map((c: Contact) => (
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
                <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-xs font-bold", c.notified ? "bg-mint-500/15 text-mint-300" : "bg-ink-700 text-mist")}>
                  {c.name.slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={cn("truncate text-sm font-bold", c.notified ? "text-mist" : "text-paper")}>{c.name}</p>
                  <p className="flex items-center gap-1.5 font-mono text-[11px] tracking-wider text-faint">
                    {fmtPhone(c.number)}
                    <span className="rounded border border-line px-1 text-[9px] uppercase">{c.group}</span>
                  </p>
                </div>
                <button
                  onClick={() => onToggleNotified(c.id)}
                  className={cn(
                    "rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition-colors",
                    c.notified ? "border-mint-500/30 bg-mint-500/10 text-mint-300" : "border-line text-faint hover:border-ink-600 hover:text-mist",
                  )}
                >
                  {c.notified ? "Sent" : "Mark sent"}
                </button>
                <a
                  href={`https://wa.me/91${c.number}?text=${encodeURIComponent(rendered)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg bg-[#1f8a4c] px-3 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-[#249c57]"
                  aria-label={`WhatsApp ${c.name}`}
                >
                  <MessageCircle size={12} /> Chat
                </a>
                <button
                  onClick={() => onDeleteContact(c.id)}
                  className="rounded-md p-1.5 text-faint transition-colors hover:bg-flare-500/10 hover:text-flare-300"
                  aria-label={`Remove ${c.name}`}
                >
                  <Trash2 size={13} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          {vault.contacts.length === 0 && (
            <p className="rounded-xl border border-dashed border-line bg-ink-900/40 px-4 py-8 text-center text-xs text-faint">
              No contacts yet. Add people one by one, or use <b className="text-mist">Bulk paste</b> — one
              “Name, 98xxxxxxx” per line — to import your whole address book.
            </p>
          )}
        </div>

        {vault.contacts.length > 0 && (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <button
              onClick={() => copy(vault.contacts.map((c) => c.number).join(", "), "All numbers")}
              className="flex items-center justify-center gap-2 rounded-lg border border-line px-3 py-2 text-[11px] font-bold text-mist transition-colors hover:border-ink-600 hover:text-paper"
            >
              <Copy size={12} /> Copy all numbers
            </button>
            <button
              onClick={() => copy(rendered, "Message")}
              className="flex items-center justify-center gap-2 rounded-lg border border-line px-3 py-2 text-[11px] font-bold text-mist transition-colors hover:border-ink-600 hover:text-paper"
            >
              <Copy size={12} /> Copy message once
            </button>
          </div>
        )}
      </section>

      {/* bulk paste modal */}
      <Modal
        open={pasteOpen}
        onClose={() => setPasteOpen(false)}
        title="Bulk paste contacts"
        subtitle="One contact per line · “Name, 9876543210” or just the number"
        wide
      >
        <div className="space-y-3">
          <textarea
            className={`${inputCls} min-h-40 resize-y font-mono text-xs`}
            placeholder={"Amma, 9876543210\nArjun (office), 9765432109\n9812345678"}
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            autoFocus
          />
          <p className="text-[11px] text-faint">
            Valid 10-digit Indian mobiles are imported and tagged <b className="text-mist">{group}</b>; duplicates and
            junk lines are skipped automatically.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setPasteOpen(false)}>
              Cancel
            </Button>
            <Button className="flex-1" disabled={pasteText.trim() === ""} onClick={parsePaste} icon={<ClipboardPaste size={14} />}>
              Import contacts
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

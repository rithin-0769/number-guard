import { ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "./ui";

export function SettingsView({ onClearData }: { onClearData: () => void }) {
  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-line bg-ink-850 p-5">
        <h2 className="flex items-center gap-2 font-display text-sm font-semibold text-paper">
          <ShieldCheck size={15} className="text-mint-400" /> Privacy & Storage
        </h2>
        <div className="mt-4 space-y-4 text-sm leading-relaxed text-mist">
          <p>
            NumberGuard is designed with a strict zero-server privacy model. 
            All data you enter into this application, including your phone numbers, checklist progress, and contacts, 
            stays entirely on your device.
          </p>
          <p>
            We use your browser's <strong className="text-paper">localStorage</strong> to persist your vault across sessions.
            Nothing is ever uploaded, synced, or shared with external servers.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-flare-500/20 bg-ink-850 p-5">
        <h2 className="flex items-center gap-2 font-display text-sm font-semibold text-paper">
          <Trash2 size={15} className="text-flare-400" /> Clear Data
        </h2>
        <p className="mt-4 mb-4 text-sm leading-relaxed text-mist">
          If you are on a shared device or simply want to erase your footprint, you can wipe all NumberGuard data from this browser. 
          This action is irreversible unless you have exported a JSON backup.
        </p>
        <Button variant="danger" icon={<Trash2 size={15} />} onClick={onClearData}>
          Clear all data
        </Button>
      </section>
    </div>
  );
}

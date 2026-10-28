import { useStore } from "../../store/useStore";
import { Bullets, Para, Section } from "./Section";

export default function NotesTab() {
  const { notes } = useStore((s) => s.problem)!;
  return (
    <div className="space-y-5">
      <Section title="Key takeaways">
        <Bullets items={notes.takeaways} marker="→" />
      </Section>
      <div className="grid gap-3">
        <Complexity label="Time" text={notes.time} />
        <Complexity label="Space" text={notes.space} />
      </div>
      <Section title="Edge cases to test">
        <Bullets items={notes.edge_cases} marker="!" />
      </Section>
    </div>
  );
}

function Complexity({ label, text }: { label: string; text: string }) {
  const big = text.match(/O\([^)]*\)/)?.[0];
  return (
    <div className="rounded-xl border border-line bg-white/[0.02] p-3">
      <div className="mb-1 flex items-baseline gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">{label}</span>
        {big && <span className="font-mono text-sm font-semibold text-p-emerald">{big}</span>}
      </div>
      <Para text={text} />
    </div>
  );
}

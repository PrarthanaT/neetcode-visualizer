import { useStore } from "../../store/useStore";
import { Bullets, Para, Section } from "./Section";

export default function PatternTab() {
  const { pattern } = useStore((s) => s.problem)!;
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-accent/25 bg-gradient-to-br from-accent/10 to-p-violet/5 p-4">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-accent">Pattern</div>
        <div className="mt-1 text-lg font-semibold tracking-tight">{pattern.name}</div>
        <div className="mt-2">
          <Para text={pattern.summary} />
        </div>
      </div>
      <Section title="How to spot it in a new problem" tone="good">
        <Bullets items={pattern.recognize} marker="✓" />
      </Section>
      <Section title="When NOT to use it" tone="warn">
        <Bullets items={pattern.avoid_when} marker="✕" />
      </Section>
    </div>
  );
}

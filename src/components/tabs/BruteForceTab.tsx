import { useStore } from "../../store/useStore";
import { Code } from "../Code";
import { Para, Section } from "./Section";

export default function BruteForceTab() {
  const { brute_force: b, notes } = useStore((s) => s.problem)!;
  const big = (t: string) => t.match(/O\([^)]*\)/)?.[0] ?? "";
  return (
    <div className="space-y-5">
      <Section title="The naive solution">
        <Code code={b.code} block />
        <Para text={b.explain} />
      </Section>
      <div className="grid grid-cols-2 gap-3">
        <Compare title="Brute force" time={big(b.time)} space={big(b.space)} tone="#fb7185" />
        <Compare title="With the pattern" time={big(notes.time)} space={big(notes.space)} tone="#34d399" />
      </div>
      <Section title="Why it's slow" tone="bad">
        <Para text={b.why_slow} />
        <Para text={`Time: ${b.time} Space: ${b.space}`} />
      </Section>
      <Section title="How the pattern fixes it" tone="good">
        <Para text={b.how_pattern_fixes} />
      </Section>
    </div>
  );
}

function Compare({ title, time, space, tone }: { title: string; time: string; space: string; tone: string }) {
  return (
    <div className="rounded-xl border border-line bg-white/[0.02] p-3">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: tone }}>{title}</div>
      <div className="flex justify-between font-mono text-[13px] text-ink-dim"><span>time</span><span className="text-ink">{time}</span></div>
      <div className="flex justify-between font-mono text-[13px] text-ink-dim"><span>memory</span><span className="text-ink">{space}</span></div>
    </div>
  );
}

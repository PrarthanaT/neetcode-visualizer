import { useStore } from "../../store/useStore";
import { Code } from "../Code";
import { Prose } from "../Prose";
import { Para, Section } from "./Section";

export default function LineTab() {
  const problem = useStore((s) => s.problem)!;
  const pinned = useStore((s) => s.pinnedLine);
  const stepLine = useStore((s) => s.trace?.steps[s.cursor]?.line ?? null);
  const pinLine = useStore((s) => s.pinLine);
  const line = pinned ?? stepLine ?? 1;
  const text = problem.code.split("\n")[line - 1] ?? "";
  const info = problem.lines[String(line)];

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-[11px] text-ink-faint">
          <span className="rounded-md bg-white/5 px-1.5 py-0.5 font-mono">line {line}</span>
          {pinned ? (
            <>
              <span>you clicked this line</span>
              <button onClick={() => pinLine(null)} className="ml-auto text-accent hover:underline">
                follow the highlighted line again
              </button>
            </>
          ) : (
            <span>following the highlighted line · click a line in the code to read about it</span>
          )}
        </div>
        <div className="overflow-x-auto rounded-xl border border-accent/25 bg-accent/[0.05] px-3 py-2.5 shadow-[0_0_24px_rgb(124_156_255/0.08)]">
          {text.trim() ? <Code code={text.replace(/^\s+/, "")} className="whitespace-pre" /> : <span className="text-xs text-ink-faint">(blank line)</span>}
        </div>
      </div>

      {!info ? (
        <Para
          text={
            text.trim()
              ? "No notes for this line yet."
              : "This line is empty. Python ignores blank lines completely. Programmers use them like paragraph breaks, to separate steps and make the code easier to read."
          }
        />
      ) : (
        <>
          <Section title="What it does">
            <Para text={info.explain} />
          </Section>

          <Section title="Piece by piece">
            <div className="overflow-hidden rounded-xl border border-line">
              {info.syntax.map((s, i) => (
                <div key={i} className="grid grid-cols-[minmax(84px,auto)_1fr] gap-3 border-b border-line px-3 py-2 last:border-b-0 odd:bg-white/[0.015]">
                  <code className="self-start whitespace-pre rounded-md bg-white/[0.06] px-1.5 py-0.5 font-mono text-[12px] text-p-sky">
                    {/^\s+\(/.test(s.token) ? <span className="text-ink-faint">⇥ indent {s.token.trim()}</span> : s.token}
                  </code>
                  <span className="text-[13px] leading-relaxed text-ink-dim">
                    <Prose text={s.meaning} />
                  </span>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Why it's written this way">
            <Para text={info.why} />
          </Section>

          <Section title="If you remove or change it" tone="bad">
            <Para text={info.if_removed} />
          </Section>

          <Section title="Other ways to write it">
            <div className="space-y-2.5">
              {info.alternatives.map((a, i) => (
                <div key={i} className="rounded-xl border border-line bg-white/[0.02] p-3">
                  <Code code={a.code} block className="!border-0 !bg-transparent !p-0" />
                  <p className="mt-2 text-[13px] leading-relaxed text-ink-dim">
                    <Prose text={a.difference} />
                  </p>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Common beginner mistake" tone="warn">
            <div className="rounded-xl border border-p-rose/25 bg-p-rose/[0.06] p-3">
              <Para text={info.mistake} />
            </div>
          </Section>
        </>
      )}
    </div>
  );
}

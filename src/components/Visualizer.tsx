import { motion } from "framer-motion";
import { RENDERERS } from "../renderers";
import { useStore } from "../store/useStore";
import type { PanelSpec } from "../types/problem";

export default function Visualizer() {
  const problem = useStore((s) => s.problem);
  const trace = useStore((s) => s.trace);
  const cursor = useStore((s) => s.cursor);
  const status = useStore((s) => s.status);
  const error = useStore((s) => s.error);

  const step = trace?.steps[cursor];
  const prev = cursor > 0 ? trace?.steps[cursor - 1] : undefined;

  return (
    <div className="glow-backdrop card relative overflow-hidden p-5">
      {!step ? (
        <Loading status={status} error={error} />
      ) : (
        <div className="flex flex-col gap-5">
          {rows(problem!.visualizer.map((spec, i) => ({ spec, i }))).map((row) => (
            <div key={row[0].i} className={row.length > 1 ? "grid grid-cols-2 gap-4" : ""}>
              {row.map(({ spec, i }) => {
                const R = RENDERERS[spec.type];
                if (!R) return null;
                return (
                  <R
                    key={`${problem!.slug}-${i}`}
                    spec={spec}
                    step={step}
                    cursor={cursor}
                    get={(k: string) => step.viz[`${i}.${k}`]}
                    getPrev={(k: string) => prev?.viz[`${i}.${k}`]}
                  />
                );
              })}
            </div>
          ))}
          {trace?.error && cursor === trace.steps.length - 1 && (
            <div className="rounded-lg border border-p-rose/40 bg-p-rose/10 px-3 py-2 font-mono text-xs text-p-rose">
              {trace.error.type}: {trace.error.message}
              {trace.error.line ? ` (line ${trace.error.line})` : ""}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Consecutive hashmaps sit side by side; everything else gets its own row. */
function rows<T extends { spec: PanelSpec }>(panels: T[]): T[][] {
  const out: T[][] = [];
  for (const p of panels) {
    const last = out[out.length - 1];
    if (p.spec.type === "hashmap" && last?.length === 1 && last[0].spec.type === "hashmap") last.push(p);
    else out.push([p]);
  }
  return out;
}

function Loading({ status, error }: { status: string; error: string | null }) {
  if (status === "error")
    return <div className="py-8 text-center text-sm text-p-rose">Could not run the solution: {error}</div>;
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-sm text-ink-dim">
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="size-2 rounded-full bg-accent"
            animate={{ opacity: [0.2, 1, 0.2], y: [0, -4, 0] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
      Starting Python in your browser… (the first time takes a few seconds)
    </div>
  );
}

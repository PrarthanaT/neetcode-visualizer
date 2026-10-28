import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useStore } from "../store/useStore";
import { useDone } from "../lib/useDone";
import { DIFF_COLOR } from "./Sidebar";
import { CheckIcon, ChevronIcon } from "./Icons";
import { Prose } from "./Prose";

export default function ProblemHeader() {
  const problem = useStore((s) => s.problem);
  const [open, setOpen] = useState(true);
  const { done, toggle } = useDone();
  if (!problem) return null;
  const isDone = done.has(problem.slug);
  const color = DIFF_COLOR[problem.difficulty];

  return (
    <div className="shrink-0 border-b border-line">
      <div className="flex items-center gap-3 px-4 pb-2 pt-4">
        <h1 className="truncate text-lg font-semibold tracking-tight">{problem.title}</h1>
        <span className="rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ color, background: `${color}1a` }}>
          {problem.difficulty}
        </span>
        <span className="truncate text-xs text-ink-faint">{problem.category}</span>
        <button
          onClick={() => toggle(problem.slug)}
          className={`ml-auto flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition ${
            isDone ? "border-p-emerald/40 bg-p-emerald/10 text-p-emerald" : "border-line text-ink-dim hover:border-line-strong hover:text-ink"
          }`}
        >
          {isDone && <CheckIcon />} {isDone ? "Done" : "Mark done"}
        </button>
      </div>
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1.5 px-4 pb-2 text-xs text-ink-faint hover:text-ink-dim">
        <ChevronIcon open={open} /> The problem
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="max-h-44 space-y-2 overflow-y-auto px-4 pb-4">
              {problem.statement.map((s, i) => (
                <p key={i} className="text-[13.5px] leading-relaxed text-ink-dim">
                  <Prose text={s} />
                </p>
              ))}
              {problem.examples?.map((e, i) => (
                <div key={i} className="rounded-lg border border-line bg-white/[0.02] px-3 py-2 text-[12.5px]">
                  <div className="font-mono text-ink">
                    <span className="text-ink-faint">input </span>{e.input}
                    <span className="text-ink-faint">  →  output </span>{e.output}
                  </div>
                  <div className="mt-1 text-ink-dim">{e.explain}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

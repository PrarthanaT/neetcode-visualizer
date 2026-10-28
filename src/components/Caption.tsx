import { AnimatePresence, motion } from "framer-motion";
import { useStore } from "../store/useStore";

export default function Caption() {
  const step = useStore((s) => s.trace?.steps[s.cursor]);
  const cursor = useStore((s) => s.cursor);
  const text = step?.caption ?? (step ? `Running line ${step.line}.` : "");

  return (
    <div className="relative flex min-h-11 items-center gap-3 overflow-hidden rounded-xl border border-line bg-panel px-4 py-2.5">
      {step && (
        <span className="shrink-0 rounded-md bg-accent/12 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-accent">
          {step.event === "return" ? "RETURN" : step.event === "call" ? "CALL" : `LINE ${step.line}`}
        </span>
      )}
      <AnimatePresence mode="wait" initial={false}>
        <motion.p
          key={cursor + text}
          initial={{ opacity: 0, y: 6, filter: "blur(2px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -6, filter: "blur(2px)" }}
          transition={{ duration: 0.18 }}
          className="text-[14px] leading-snug text-ink"
        >
          {text}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

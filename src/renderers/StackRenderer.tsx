import { AnimatePresence, motion } from "framer-motion";
import type { PanelSpec } from "../types/problem";
import type { RendererProps } from "./types";
import { asIndexList, fmtPlain } from "../lib/format";
import { MARK, glow, tint } from "../lib/colors";
import { Empty, PanelTitle } from "./ArrayRenderer";

type StackSpec = Extract<PanelSpec, { type: "stack" }>;

/** A vertical stack: index 0 at the bottom, the last item on top. Pushes drop in, pops lift off. */
export default function StackRenderer({ spec, get }: RendererProps<StackSpec>) {
  const raw = get("source");
  if (!Array.isArray(raw)) return <Empty title={spec.title} text="not created yet" />;

  const compared = new Set(asIndexList(get("mark.compared")));
  const found = new Set(asIndexList(get("mark.found")));
  const top = raw.length - 1;

  return (
    <div>
      <PanelTitle title={spec.title} extra={<span className="text-ink-faint/70">{raw.length} item{raw.length === 1 ? "" : "s"} · last in, first out</span>} />
      <div className="flex justify-center">
        <div className="relative flex min-h-[132px] w-40 flex-col-reverse items-stretch gap-1.5 rounded-b-2xl border-x-2 border-b-2 border-white/10 px-2 pb-2 pt-6">
          <AnimatePresence initial={false}>
            {raw.length === 0 && (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="my-auto text-center font-mono text-xs text-ink-faint">
                empty
              </motion.div>
            )}
            {raw.map((v, i) => {
              const isFound = found.has(i);
              const isCompared = compared.has(i) && !isFound;
              const color = isFound ? MARK.found : isCompared ? MARK.compared : null;
              return (
                <motion.div
                  key={`${i}:${fmtPlain(v)}`}
                  layout
                  initial={{ opacity: 0, y: -40, scale: 0.9 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    backgroundColor: color ? tint(color, 0.14) : "rgb(255 255 255 / 0.04)",
                    boxShadow: color ? `inset 0 0 0 1.5px ${color}, ${glow(color, 0.45, 16)}` : "inset 0 0 0 1px rgb(255 255 255 / 0.1)",
                  }}
                  exit={{ opacity: 0, y: -48, scale: 0.85, transition: { duration: 0.25 } }}
                  transition={{ type: "spring", stiffness: 420, damping: 30 }}
                  className="relative flex h-9 items-center justify-center rounded-lg font-mono text-[15px] font-semibold"
                >
                  <span style={{ color: color ?? "var(--color-ink)" }}>{typeof v === "string" ? v : fmtPlain(v)}</span>
                  <span className="absolute left-2 font-mono text-[9px] font-normal text-ink-faint">{i}</span>
                  {i === top && (
                    <motion.span layoutId={`${spec.title}-top`} className="absolute -right-12 font-mono text-[10px] font-semibold text-p-violet">
                      ← top
                    </motion.span>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

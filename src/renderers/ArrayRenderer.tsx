import { AnimatePresence, motion } from "framer-motion";
import type { PanelSpec } from "../types/problem";
import type { RendererProps } from "./types";
import { asIndex, asIndexList, fmtPlain } from "../lib/format";
import { MARK, glow, pointerColor, tint } from "../lib/colors";

const CELL = 48;
const GAP = 8;
const CHIP_ROW = 22;
const EDGE_ROOM = 54; // space under the cells for edges-mode "index -> value" arrows

type ArraySpec = Extract<PanelSpec, { type: "array" }>;

export default function ArrayRenderer({ spec, get }: RendererProps<ArraySpec>) {
  const raw = get("source");
  const items = Array.isArray(raw) ? raw : null;

  if (!items) return <Empty title={spec.title} text="not created yet" />;

  const compared = new Set(asIndexList(get("mark.compared")));
  const found = new Set(asIndexList(get("mark.found")));
  const done = new Set(asIndexList(get("mark.done")));

  // pointer label -> index, grouped so labels on the same cell stack instead of overlapping
  const pointers = Object.keys(spec.pointers ?? {}).map((label, i) => ({
    label,
    color: pointerColor(i),
    index: asIndex(get(`ptr.${label}`)),
  }));
  const stackAt = new Map<number, number>();
  const placed = pointers
    .filter((p) => p.index !== null)
    .map((p) => {
      const level = stackAt.get(p.index!) ?? 0;
      stackAt.set(p.index!, level + 1);
      return { ...p, level };
    });
  const levels = Math.max(1, ...Array.from(stackAt.values()));
  const width = items.length * CELL + Math.max(0, items.length - 1) * GAP;
  const top = levels * CHIP_ROW + 6;
  const edgeRoom = spec.edges ? EDGE_ROOM : 0;
  const xOf = (i: number) => i * (CELL + GAP) + CELL / 2;

  return (
    <div>
      <PanelTitle title={spec.title} />
      <div className="overflow-x-auto pb-1">
        <div className="relative mx-auto" style={{ width: Math.max(width, CELL), paddingTop: top, paddingBottom: edgeRoom }}>
          {/* edges: each index i arrows to index items[i], treating the array as a "next pointer" at every position */}
          {spec.edges && (
            <svg className="pointer-events-none absolute left-0 overflow-visible" style={{ top: top + CELL }} width={Math.max(width, CELL)} height={edgeRoom}>
              <defs>
                <marker id="arr-edge-head" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M0 0 L10 5 L0 10 z" fill="#71717a" />
                </marker>
              </defs>
              {items.map((v, i) => {
                const j = typeof v === "number" ? v : null;
                if (j === null || j < 0 || j >= items.length) return null;
                const x1 = xOf(i);
                const x2 = xOf(j);
                const isMarked = (compared.has(i) && compared.has(j)) || (found.has(i) && found.has(j));
                if (i === j) {
                  const bow = 20;
                  return (
                    <path key={i} d={`M ${x1 - 3} -2 C ${x1 - CELL / 2} ${bow}, ${x1 + CELL / 2} ${bow}, ${x1 + 3} -2`} fill="none" stroke={isMarked ? MARK.compared : "#71717a"} strokeWidth={1.5} markerEnd="url(#arr-edge-head)" />
                  );
                }
                const bow = Math.min(edgeRoom - 8, 16 + Math.abs(j - i) * 7);
                return (
                  <path
                    key={i}
                    d={`M ${x1} -2 C ${x1} ${bow}, ${x2} ${bow}, ${x2} -2`}
                    fill="none"
                    stroke={isMarked ? MARK.compared : "#71717a"}
                    strokeWidth={isMarked ? 2 : 1.5}
                    markerEnd="url(#arr-edge-head)"
                  />
                );
              })}
            </svg>
          )}

          {/* pointer chips */}
          {placed.map((p) => {
            const outside = p.index! < 0 || p.index! >= items.length;
            return (
              <motion.div
                key={p.label}
                className="absolute flex justify-center"
                style={{ width: CELL, top: (levels - 1 - p.level) * CHIP_ROW }}
                initial={false}
                animate={{ x: p.index! * (CELL + GAP), opacity: outside ? 0.45 : 1 }}
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
              >
                <span
                  className="flex items-center gap-0.5 rounded-md px-1.5 font-mono text-[11px] font-semibold leading-[18px]"
                  style={{ color: p.color, background: tint(p.color, 0.14), boxShadow: `inset 0 0 0 1px ${tint(p.color, 0.35)}` }}
                >
                  {p.label}
                  <span className="text-[9px] opacity-70">▼</span>
                </span>
              </motion.div>
            );
          })}

          {/* cells */}
          <div className="flex" style={{ gap: GAP }}>
            {items.map((v, i) => {
              const ptr = placed.find((p) => p.index === i);
              const isFound = found.has(i);
              const isCompared = compared.has(i) && !isFound;
              const isDone = done.has(i) && !isFound && !isCompared;
              const border = isFound ? MARK.found : isCompared ? MARK.compared : ptr ? tint(ptr.color, 0.6) : "rgb(255 255 255 / 0.09)";
              return (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <motion.div
                    className="relative grid place-items-center overflow-hidden rounded-xl font-mono text-[15px] font-semibold"
                    style={{ width: CELL, height: CELL }}
                    initial={false}
                    animate={{
                      backgroundColor: isFound ? tint(MARK.found, 0.16) : isCompared ? tint(MARK.compared, 0.12) : "rgb(255 255 255 / 0.03)",
                      boxShadow: `inset 0 0 0 1.5px ${border}${isFound ? `, ${glow(MARK.found, 0.6, 22)}` : isCompared ? `, ${glow(MARK.compared, 0.35, 16)}` : ""}`,
                      opacity: isDone ? 0.38 : 1,
                      y: isCompared || isFound ? -3 : 0,
                    }}
                    transition={{ duration: 0.28, ease: "easeOut" }}
                  >
                    <AnimatePresence mode="popLayout" initial={false}>
                      <motion.span
                        key={fmtPlain(v)}
                        initial={{ y: 14, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -14, opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        style={{ color: isFound ? MARK.found : "var(--color-ink)" }}
                      >
                        {typeof v === "string" ? v : fmtPlain(v)}
                      </motion.span>
                    </AnimatePresence>
                  </motion.div>
                  <span className="font-mono text-[10px] text-ink-faint">{i}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <Legend compared={compared.size > 0} found={found.size > 0} done={done.size > 0} />
    </div>
  );
}

function Legend(props: { compared: boolean; found: boolean; done: boolean }) {
  const items = [
    props.compared && { c: MARK.compared, t: "looking at" },
    props.found && { c: MARK.found, t: "found" },
    props.done && { c: "#52525b", t: "done" },
  ].filter(Boolean) as { c: string; t: string }[];
  if (!items.length) return null;
  return (
    <div className="mt-2 flex justify-center gap-3 text-[10px] text-ink-faint">
      {items.map((x) => (
        <span key={x.t} className="flex items-center gap-1">
          <span className="size-2 rounded-full" style={{ background: x.c }} />
          {x.t}
        </span>
      ))}
    </div>
  );
}

export function PanelTitle({ title, extra }: { title: string; extra?: React.ReactNode }) {
  return (
    <div className="mb-2 flex items-center gap-2 font-mono text-[11px] text-ink-faint">
      <span className="font-semibold text-ink-dim">{title}</span>
      {extra}
    </div>
  );
}

export function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <PanelTitle title={title} />
      <div className="rounded-xl border border-dashed border-line py-4 text-center text-xs text-ink-faint">{text}</div>
    </div>
  );
}

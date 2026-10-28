import { motion } from "framer-motion";
import type { PanelSpec } from "../types/problem";
import type { HeapObject, Step, Value } from "../types/trace";
import type { RendererProps } from "./types";
import { MARK, glow, pointerColor, tint } from "../lib/colors";
import { Empty, PanelTitle } from "./ArrayRenderer";
import { useStore } from "../store/useStore";

type ListSpec = Extract<PanelSpec, { type: "linkedlist" }>;
type Obj = Extract<HeapObject, { type: "obj" }>;

const VAL_W = 40;
const NEXT_W = 22;
const NODE_W = VAL_W + NEXT_W;
const NODE_H = 40;
const GAP = 32;
const NULL_W = 42;
const CHIP_ROW = 22;
const ARROW_ROOM = 34; // space under the nodes for arrows that point backwards

/** Nodes drawn in a fixed order (the order Python first saw them), each with a val box and a next box.
 *  Arrows follow the real `next` references, so you can watch them flip as the list is rewired. */
export default function LinkedListRenderer({ spec, step, get, cursor }: RendererProps<ListSpec>) {
  const valField = spec.val_field ?? "val";
  const nextField = spec.next_field ?? "next";
  const prevStep = useStepBefore(cursor);
  const nodes = nodesOf(step, spec.node_class);
  if (!nodes.length) return <Empty title={spec.title} text="no nodes yet" />;

  const prevNext = new Map(prevStep ? nodesOf(prevStep, spec.node_class).map(([id, o]) => [id, refOf(o.fields[nextField])]) : []);

  const col = new Map(nodes.map(([id], i) => [id, i]));
  const x0 = NULL_W + GAP; // leave room for the left None slot
  const xOf = (i: number) => x0 + i * (NODE_W + GAP);
  const rightNullX = xOf(nodes.length);
  const width = rightNullX + NULL_W;

  // pointer chips, stacked when several share a slot
  const pointers = Object.keys(spec.pointers ?? {}).flatMap((label, i) => {
    const v = get(`ptr.${label}`);
    if (v === undefined) return []; // hidden on this step
    const id = v && typeof v === "object" && !Array.isArray(v) ? v.ref : null;
    const slot = id && col.has(id) ? xOf(col.get(id)!) + VAL_W / 2 : spec.null_left?.includes(label) ? NULL_W / 2 : rightNullX + NULL_W / 2;
    return [{ label, color: pointerColor(i), x: slot, isNull: !id }];
  });
  const level = new Map<number, number>();
  const placed = pointers.map((p) => {
    const l = level.get(p.x) ?? 0;
    level.set(p.x, l + 1);
    return { ...p, level: l };
  });
  const levels = Math.max(1, ...level.values());
  const top = levels * CHIP_ROW + 8;
  const midY = top + NODE_H / 2;
  const pointed = new Map(placed.filter((p) => !p.isNull).map((p) => [p.x, p.color]));

  return (
    <div>
      <PanelTitle title={spec.title} extra={<span className="text-ink-faint/70">each box: value │ next</span>} />
      <div className="overflow-x-auto pb-1">
        <div className="relative mx-auto" style={{ width, height: top + NODE_H + ARROW_ROOM }}>
          {/* None slots */}
          {[0, rightNullX].map((x) => (
            <div key={x} className="absolute grid place-items-center rounded-lg border border-dashed border-white/10 font-mono text-[11px] text-ink-faint" style={{ left: x, top, width: NULL_W, height: NODE_H }}>
              None
            </div>
          ))}

          {/* arrows */}
          <svg className="pointer-events-none absolute inset-0 overflow-visible" width={width} height={top + NODE_H + ARROW_ROOM}>
            <defs>
              {["idle", "changed"].map((k) => (
                <marker key={k} id={`ll-head-${k}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M0 0 L10 5 L0 10 z" fill={k === "changed" ? MARK.compared : "#71717a"} />
                </marker>
              ))}
            </defs>
            {nodes.map(([id, o], i) => {
              const target = refOf(o.fields[nextField]);
              const changed = prevStep !== undefined && prevNext.has(id) && prevNext.get(id) !== target;
              const startX = xOf(i) + VAL_W + NEXT_W / 2;
              let d: string;
              if (target && col.has(target)) {
                const j = col.get(target)!;
                d = j > i ? forward(startX, midY, xOf(j)) : backward(startX, top + NODE_H, xOf(j) + VAL_W / 2, top + NODE_H);
              } else {
                // None: point into the right-hand None slot when that's the next box over, otherwise a short stub down
                // reversed lists end on the left, so the first node's None curves back into the left slot
                d =
                  i === nodes.length - 1 ? forward(startX, midY, rightNullX)
                  : i === 0 ? backward(startX, top + NODE_H, NULL_W / 2, top + NODE_H)
                  : stub(startX, top + NODE_H);
              }
              const color = changed ? MARK.compared : "#71717a";
              return (
                <motion.path
                  key={id}
                  initial={false}
                  animate={{ d, stroke: color }}
                  transition={{ type: "spring", stiffness: 200, damping: 26 }}
                  fill="none"
                  strokeWidth={changed ? 2.2 : 1.6}
                  markerEnd={target || i === 0 || i === nodes.length - 1 ? `url(#ll-head-${changed ? "changed" : "idle"})` : undefined}
                  style={{ filter: changed ? `drop-shadow(0 0 4px ${MARK.compared})` : undefined }}
                />
              );
            })}
          </svg>

          {/* nodes */}
          {nodes.map(([id, o], i) => {
            const accent = pointed.get(xOf(i) + VAL_W / 2);
            const isNone = o.fields[nextField]?.k === "none";
            return (
              <motion.div
                key={id}
                className="absolute flex overflow-hidden rounded-lg font-mono"
                style={{ left: xOf(i), top, width: NODE_W, height: NODE_H }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  boxShadow: accent ? `inset 0 0 0 1.5px ${tint(accent, 0.8)}, ${glow(accent, 0.35, 16)}` : "inset 0 0 0 1px rgb(255 255 255 / 0.12)",
                }}
                transition={{ duration: 0.25 }}
              >
                <div className="grid place-items-center bg-white/[0.04] text-[15px] font-semibold text-ink" style={{ width: VAL_W }}>
                  {fmtField(o.fields[valField])}
                </div>
                <div className="grid place-items-center border-l border-white/10 text-[10px] text-ink-faint" style={{ width: NEXT_W }}>
                  {isNone ? "∅" : "•"}
                </div>
              </motion.div>
            );
          })}

          {/* pointer chips */}
          {placed.map((p) => (
            <motion.div
              key={p.label}
              className="absolute flex -translate-x-1/2 justify-center"
              style={{ top: (levels - 1 - p.level) * CHIP_ROW }}
              initial={false}
              animate={{ left: p.x }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
            >
              <span
                className="flex items-center gap-0.5 whitespace-nowrap rounded-md px-1.5 font-mono text-[11px] font-semibold leading-[18px]"
                style={{ color: p.color, background: tint(p.color, 0.14), boxShadow: `inset 0 0 0 1px ${tint(p.color, 0.35)}` }}
              >
                {p.label}
                <span className="text-[9px] opacity-70">▼</span>
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// all three shapes use the same commands so framer-motion can morph between them
const forward = (x1: number, y: number, x2: number) => `M ${x1} ${y} C ${x1 + 12} ${y}, ${x2 - 14} ${y}, ${x2 - 2} ${y}`;
const backward = (x1: number, y1: number, x2: number, y2: number) => `M ${x1} ${y1 - 4} C ${x1} ${y1 + 30}, ${x2} ${y2 + 30}, ${x2} ${y2 + 2}`;
const stub = (x: number, y: number) => `M ${x} ${y - 4} C ${x} ${y}, ${x} ${y}, ${x} ${y - 4}`;

const refOf = (v: Value | undefined) => (v && v.k === "ref" ? v.id : null);

function fmtField(v: Value | undefined) {
  if (!v) return "";
  if (v.k === "num") return String(v.v);
  if (v.k === "str") return `'${v.v}'`;
  if (v.k === "bool") return v.v ? "True" : "False";
  return v.k === "none" ? "None" : "…";
}

function nodesOf(step: Step, cls: string): [string, Obj][] {
  return Object.entries(step.heap)
    .filter((e): e is [string, Obj] => e[1]?.type === "obj" && (e[1] as Obj).cls === cls)
    .sort((a, b) => Number(a[0]) - Number(b[0]));
}

function useStepBefore(cursor: number) {
  return useStore((s) => (cursor > 0 ? s.trace?.steps[cursor - 1] : undefined));
}

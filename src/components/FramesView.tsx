import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useStore } from "../store/useStore";
import type { HeapObject, Value } from "../types/trace";
import { ChevronIcon } from "./Icons";

/** Python Tutor style: the call stack with every variable on the left, the objects they point to on the right. */
export default function FramesView() {
  const step = useStore((s) => s.trace?.steps[s.cursor]);
  const prev = useStore((s) => (s.cursor > 0 ? s.trace?.steps[s.cursor - 1] : undefined));
  const [open, setOpen] = useState(true);
  const [hover, setHover] = useState<string | null>(null);
  if (!step) return null;

  const prevVals = new Map<string, string>();
  prev?.frames.forEach((f, depth) => f.locals.forEach(([n, v]) => prevVals.set(`${depth}:${f.name}:${n}`, sig(v, prev.heap))));

  // objects in the order variables first point at them
  const order: string[] = [];
  const visit = (v: Value) => {
    if (v.k !== "ref" || order.includes(v.id)) return;
    order.push(v.id);
    const o = step.heap[v.id];
    if (o && "items" in o) o.items.forEach(visit);
    if (o && "entries" in o) o.entries.forEach(([k, x]) => (visit(k), visit(x)));
    if (o && o.type === "obj") Object.values((o as { fields: Record<string, Value> }).fields).forEach(visit);
  };
  step.frames.forEach((f) => f.locals.forEach(([, v]) => visit(v)));
  const objects = order.filter((id) => {
    const o = step.heap[id];
    return o && o.type !== "class" && o.type !== "func";
  });

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs font-medium text-ink-dim hover:text-ink"
      >
        <ChevronIcon open={open} />
        Variables & call stack
        <span className="ml-auto font-mono text-[10px] text-ink-faint">
          {step.frames.map((f) => f.name).join(" → ")}
        </span>
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
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3 border-t border-line p-3">
              <div className="flex flex-col gap-2">
                <ColumnLabel>Frames</ColumnLabel>
                {step.frames.map((f, depth) => {
                  const active = depth === step.frames.length - 1;
                  return (
                    <motion.div
                      key={`${depth}-${f.name}`}
                      layout
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`rounded-lg border p-2 ${active ? "border-accent/40 bg-accent/[0.06]" : "border-line bg-white/[0.02]"}`}
                    >
                      <div className={`mb-1 font-mono text-[11px] font-semibold ${active ? "text-accent" : "text-ink-faint"}`}>
                        {f.name}
                      </div>
                      {f.locals.length === 0 && <div className="font-mono text-[11px] text-ink-faint">no variables yet</div>}
                      {f.locals.map(([name, v]) => {
                        const key = `${depth}:${f.name}:${name}`;
                        const changed = prev && prevVals.get(key) !== sig(v, step.heap);
                        return (
                          <div key={name} className="relative flex items-center justify-between gap-2 py-0.5 font-mono text-[12px]">
                            {changed && (
                              <motion.span
                                key={`${name}-${useStore.getState().cursor}`}
                                className="absolute -inset-x-1 inset-y-0 rounded bg-p-amber/15"
                                initial={{ opacity: 1 }}
                                animate={{ opacity: 0 }}
                                transition={{ duration: 1.2 }}
                              />
                            )}
                            <span className="relative text-ink-dim">{name}</span>
                            <ValueChip v={v} heap={step.heap} hover={hover} setHover={setHover} />
                          </div>
                        );
                      })}
                    </motion.div>
                  );
                })}
              </div>
              <div className="flex min-w-0 flex-col gap-2">
                <ColumnLabel>Objects</ColumnLabel>
                {objects.length === 0 && <div className="font-mono text-[11px] text-ink-faint">none yet</div>}
                {objects.map((id) => (
                  <ObjectCard key={id} id={id} obj={step.heap[id]} hover={hover} setHover={setHover} />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ColumnLabel({ children }: { children: React.ReactNode }) {
  return <div className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">{children}</div>;
}

/** Signature used to spot variables whose value changed between steps. */
function sig(v: Value, heap: Record<string, HeapObject>): string {
  if (v.k !== "ref") return JSON.stringify(v);
  return v.id + JSON.stringify(heap[v.id]);
}

type HoverProps = { hover: string | null; setHover: (id: string | null) => void };

function ValueChip({ v, heap, hover, setHover }: { v: Value; heap: Record<string, HeapObject> } & HoverProps) {
  if (v.k !== "ref") return <span className="relative truncate text-ink">{prim(v)}</span>;
  const o = heap[v.id];
  const label = !o ? "…" : o.type === "obj" ? (o as { cls: string }).cls : o.type === "class" || o.type === "func" ? `${o.type} ${(o as { name: string }).name}` : o.type;
  const isCallable = o && (o.type === "class" || o.type === "func");
  return (
    <span
      onMouseEnter={() => !isCallable && setHover(v.id)}
      onMouseLeave={() => setHover(null)}
      className={`relative cursor-default rounded px-1.5 text-[11px] transition ${
        isCallable ? "text-ink-faint" : hover === v.id ? "bg-p-violet/25 text-p-violet" : "bg-p-violet/10 text-p-violet"
      }`}
    >
      {isCallable ? label : `${label} #${v.id} →`}
    </span>
  );
}

function prim(v: Value): string {
  switch (v.k) {
    case "none": return "None";
    case "bool": return v.v ? "True" : "False";
    case "num": return String(v.v);
    case "str": return `'${v.v}'`;
    default: return "";
  }
}

function ObjectCard({ id, obj, hover, setHover }: { id: string; obj: HeapObject } & HoverProps) {
  const hot = hover === id;
  const inner = (v: Value) =>
    v.k === "ref" ? (
      <span className="text-p-violet" onMouseEnter={() => setHover(v.id)} onMouseLeave={() => setHover(null)}>#{v.id}</span>
    ) : (
      prim(v)
    );
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`rounded-lg border p-2 font-mono text-[11px] transition-colors ${hot ? "border-p-violet/60 bg-p-violet/[0.08]" : "border-line bg-white/[0.02]"}`}
    >
      <div className="mb-1 text-ink-faint">
        #{id} <span className="text-ink-dim">{obj.type === "obj" ? (obj as { cls: string }).cls : obj.type}</span>
      </div>
      {"items" in obj && (
        <div className="flex flex-wrap gap-1">
          {obj.items.length === 0 && <span className="text-ink-faint">empty</span>}
          {obj.items.map((v, i) => (
            <span key={i} className="flex flex-col items-center rounded border border-line px-1.5 py-0.5">
              <span className="text-ink">{inner(v)}</span>
              {obj.type !== "set" && <span className="text-[9px] text-ink-faint">{i}</span>}
            </span>
          ))}
        </div>
      )}
      {"entries" in obj && (
        <div className="flex flex-col gap-0.5">
          {obj.entries.length === 0 && <span className="text-ink-faint">empty</span>}
          {obj.entries.map(([k, v], i) => (
            <span key={i} className="text-ink">
              <span className="text-p-sky">{inner(k)}</span> <span className="text-ink-faint">→</span> {inner(v)}
            </span>
          ))}
        </div>
      )}
      {obj.type === "obj" && (
        <div className="flex flex-col gap-0.5">
          {Object.keys((obj as { fields: Record<string, Value> }).fields).length === 0 && (
            <span className="text-ink-faint">no fields</span>
          )}
          {Object.entries((obj as { fields: Record<string, Value> }).fields).map(([k, v]) => (
            <span key={k} className="text-ink">
              <span className="text-ink-dim">{k}</span> = {inner(v)}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}

import type { HeapObject, Plain, Value } from "../types/trace";

/** Python-looking text for a plain visualizer value. */
export function fmtPlain(v: Plain): string {
  if (v === null) return "None";
  if (typeof v === "boolean") return v ? "True" : "False";
  if (typeof v === "number") return String(v);
  if (typeof v === "string") return `'${v}'`;
  if (Array.isArray(v)) return `[${v.map(fmtPlain).join(", ")}]`;
  return "node";
}

/** Short text for a traced Value; refs are summarised by their heap object's type. */
export function fmtValue(v: Value, heap: Record<string, HeapObject>): string {
  switch (v.k) {
    case "none":
      return "None";
    case "bool":
      return v.v ? "True" : "False";
    case "num":
      return String(v.v);
    case "str":
      return `'${v.v}'`;
    case "ref": {
      const o = heap[v.id];
      if (!o) return "…";
      if ("items" in o) return o.type;
      if ("entries" in o) return "dict";
      if (o.type === "obj") return `${(o as { cls: string }).cls} object`;
      return (o as { name: string }).name;
    }
  }
}

export const asIndex = (v: Plain | undefined): number | null =>
  typeof v === "number" && Number.isInteger(v) ? v : null;

export const asIndexList = (v: Plain | undefined): number[] =>
  Array.isArray(v) ? v.filter((x): x is number => typeof x === "number") : [];

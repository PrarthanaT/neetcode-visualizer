// Output of src/python/tracer.py.

export type Value =
  | { k: "none" }
  | { k: "bool"; v: boolean }
  | { k: "num"; v: number | string }
  | { k: "str"; v: string }
  | { k: "ref"; id: string };

export type HeapObject =
  | { type: "list" | "tuple" | "set"; items: Value[] }
  | { type: string; entries: [Value, Value][] }
  | { type: "class" | "func"; name: string }
  | { type: "obj"; cls: string; fields: Record<string, Value> };

/** JSON-native value produced for visualizer expressions. Dicts are [key, value] pairs. */
export type Plain = null | boolean | number | string | Plain[] | { ref: string };

export interface Frame {
  name: string;
  locals: [string, Value][];
}

export interface Step {
  line: number;
  event: "line" | "call" | "return";
  frames: Frame[];
  heap: Record<string, HeapObject>;
  out: string;
  caption: string | null;
  ret?: Value;
  /** Visualizer expression results. A key is missing when its expression failed or returned HIDE. */
  viz: Record<string, Plain>;
}

export interface Trace {
  steps: Step[];
  truncated: boolean;
  error: { type: string; message: string; line: number | null } | null;
  result: Plain;
  stdout: string;
}

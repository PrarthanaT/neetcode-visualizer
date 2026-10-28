import type { PanelSpec } from "../types/problem";
import type { Plain, Step } from "../types/trace";

export interface RendererProps<S extends PanelSpec = PanelSpec> {
  spec: S;
  /** Value of one of this panel's expressions on the current step, e.g. get("source"), get("ptr.i"). */
  get: (key: string) => Plain | undefined;
  /** Same, on the previous step (undefined on the first step). */
  getPrev: (key: string) => Plain | undefined;
  step: Step;
  cursor: number;
}

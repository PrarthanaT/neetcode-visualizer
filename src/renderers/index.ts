import type { ComponentType } from "react";
import type { PanelSpec } from "../types/problem";
import type { RendererProps } from "./types";
import ArrayRenderer from "./ArrayRenderer";
import HashMapRenderer from "./HashMapRenderer";

// tree and grid renderers come later
export const RENDERERS: Partial<Record<PanelSpec["type"], ComponentType<RendererProps<any>>>> = {
  array: ArrayRenderer,
  hashmap: HashMapRenderer,
};

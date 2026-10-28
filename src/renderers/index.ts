import type { ComponentType } from "react";
import type { PanelSpec } from "../types/problem";
import type { RendererProps } from "./types";
import ArrayRenderer from "./ArrayRenderer";
import BarsRenderer from "./BarsRenderer";
import HashMapRenderer from "./HashMapRenderer";
import StackRenderer from "./StackRenderer";
import LinkedListRenderer from "./LinkedListRenderer";

// tree and grid renderers come later
export const RENDERERS: Partial<Record<PanelSpec["type"], ComponentType<RendererProps<any>>>> = {
  array: ArrayRenderer,
  bars: BarsRenderer,
  hashmap: HashMapRenderer,
  stack: StackRenderer,
  linkedlist: LinkedListRenderer,
};

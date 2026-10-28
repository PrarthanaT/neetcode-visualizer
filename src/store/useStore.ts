import { create } from "zustand";
import type { Problem } from "../types/problem";
import type { Trace } from "../types/trace";
import { traceProblem } from "../lib/runner";

type Status = "idle" | "tracing" | "ready" | "error";

interface State {
  problem: Problem | null;
  trace: Trace | null;
  status: Status;
  error: string | null;
  cursor: number;
  playing: boolean;
  /** steps per second */
  speed: number;
  /** a line the reader clicked on to read about, overriding the traced line in the Line tab */
  pinnedLine: number | null;

  loadProblem: (p: Problem) => Promise<void>;
  seek: (i: number) => void;
  next: () => void;
  back: () => void;
  togglePlay: () => void;
  setSpeed: (s: number) => void;
  pinLine: (line: number | null) => void;
}

export const useStore = create<State>((set, get) => ({
  problem: null,
  trace: null,
  status: "idle",
  error: null,
  cursor: 0,
  playing: false,
  speed: 2,
  pinnedLine: null,

  loadProblem: async (problem) => {
    set({ problem, trace: null, status: "tracing", error: null, cursor: 0, playing: false, pinnedLine: null });
    try {
      const trace = await traceProblem(problem);
      if (get().problem?.slug !== problem.slug) return; // the reader moved on
      set({ trace, status: "ready" });
    } catch (e) {
      set({ status: "error", error: String(e) });
    }
  },

  seek: (i) => {
    const n = get().trace?.steps.length ?? 0;
    set({ cursor: Math.max(0, Math.min(n - 1, i)), pinnedLine: null });
  },
  next: () => {
    const { cursor, trace } = get();
    if (!trace) return;
    if (cursor >= trace.steps.length - 1) return set({ playing: false });
    set({ cursor: cursor + 1, pinnedLine: null });
  },
  back: () => set((s) => ({ cursor: Math.max(0, s.cursor - 1), pinnedLine: null, playing: false })),
  togglePlay: () => {
    const { playing, cursor, trace } = get();
    if (!trace) return;
    // pressing play at the end starts over
    if (!playing && cursor >= trace.steps.length - 1) set({ cursor: 0 });
    set({ playing: !playing, pinnedLine: null });
  },
  setSpeed: (speed) => set({ speed }),
  pinLine: (pinnedLine) => set({ pinnedLine }),
}));

export const useCurrentStep = () =>
  useStore((s) => (s.trace && s.trace.steps.length ? s.trace.steps[s.cursor] : null));

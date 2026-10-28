import { create } from "zustand";

const KEY = "nv:done";

function read(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

/** Problems the reader has ticked off, saved in localStorage. */
export const useDone = create<{ done: Set<string>; toggle: (slug: string) => void }>((set, get) => ({
  done: new Set(read()),
  toggle: (slug) => {
    const done = new Set(get().done);
    if (done.has(slug)) done.delete(slug);
    else done.add(slug);
    try {
      localStorage.setItem(KEY, JSON.stringify([...done]));
    } catch {
      // storage blocked (private mode etc.): keep it for this session only
    }
    set({ done });
  },
}));

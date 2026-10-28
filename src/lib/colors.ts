// One accent per pointer, assigned in the order pointers are listed in the problem JSON.
export const POINTER_COLORS = [
  { name: "sky", hex: "#38bdf8" },
  { name: "violet", hex: "#a78bfa" },
  { name: "rose", hex: "#fb7185" },
  { name: "cyan", hex: "#22d3ee" },
  { name: "amber", hex: "#fbbf24" },
] as const;

export const MARK = {
  compared: "#fbbf24",
  found: "#34d399",
  miss: "#fb7185",
} as const;

// The water/area overlay drawn on top of bars, kept apart from the pointer
// and mark colors above so it never collides with them.
export const WATER = "#3b82f6";

export const pointerColor = (i: number) => POINTER_COLORS[i % POINTER_COLORS.length].hex;

export const glow = (hex: string, a = 0.55, r = 18) => {
  const n = parseInt(hex.slice(1), 16);
  return `0 0 ${r}px rgb(${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255} / ${a})`;
};

export const tint = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255} / ${a})`;
};

const base = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export const PlayIcon = () => (
  <svg {...base} fill="currentColor" stroke="none"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5Z" /></svg>
);
export const PauseIcon = () => (
  <svg {...base} fill="currentColor" stroke="none"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
);
export const BackIcon = () => (<svg {...base}><path d="m15 18-6-6 6-6" /></svg>);
export const NextIcon = () => (<svg {...base}><path d="m9 18 6-6-6-6" /></svg>);
export const RestartIcon = () => (<svg {...base}><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></svg>);
export const SearchIcon = () => (<svg {...base} width={14} height={14}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>);
export const CheckIcon = () => (<svg {...base} width={12} height={12} strokeWidth={3}><path d="M20 6 9 17l-5-5" /></svg>);
export const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg {...base} width={12} height={12} style={{ transform: open ? "rotate(90deg)" : undefined, transition: "transform 150ms" }}><path d="m9 18 6-6-6-6" /></svg>
);

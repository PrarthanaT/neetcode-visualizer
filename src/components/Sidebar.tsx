import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AVAILABLE, CATEGORIES, INDEX } from "../lib/problems";
import { useDone } from "../lib/useDone";
import { CheckIcon, ChevronIcon, SearchIcon } from "./Icons";
import type { Difficulty } from "../types/problem";

const DIFF_COLOR: Record<Difficulty, string> = { Easy: "#34d399", Medium: "#fbbf24", Hard: "#fb7185" };

export default function Sidebar({ selected, onSelect }: { selected: string; onSelect: (slug: string) => void }) {
  const [query, setQuery] = useState("");
  const { done, toggle } = useDone();
  const [closed, setClosed] = useState<Set<string>>(new Set());

  const q = query.trim().toLowerCase();
  const groups = useMemo(
    () =>
      CATEGORIES.map((c) => ({
        ...c,
        problems: c.problems.filter((p) => !q || p.title.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)),
      })).filter((c) => c.problems.length),
    [q],
  );

  const doneCount = INDEX.filter((p) => done.has(p.slug)).length;

  return (
    <div className="flex h-full flex-col">
      <div className="space-y-3 border-b border-line p-3">
        <div className="flex items-baseline justify-between px-1">
          <span className="text-xs font-semibold tracking-tight">NeetCode 150</span>
          <span className="font-mono text-[11px] text-ink-faint">
            <span className="text-ink-dim">{doneCount}</span> / {INDEX.length} done
          </span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-white/5">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-accent to-p-emerald"
            initial={false}
            animate={{ width: `${(doneCount / INDEX.length) * 100}%` }}
          />
        </div>
        <label className="flex items-center gap-2 rounded-lg border border-line bg-white/[0.03] px-2.5 py-1.5 text-ink-faint focus-within:border-accent/50 focus-within:text-ink-dim">
          <SearchIcon />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setQuery("")}
            placeholder="Search problems"
            className="w-full bg-transparent text-xs text-ink outline-none placeholder:text-ink-faint"
          />
        </label>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {groups.length === 0 && <div className="p-4 text-center text-xs text-ink-faint">No problems match "{query}"</div>}
        {groups.map((cat) => {
          const isOpen = q !== "" || !closed.has(cat.name);
          const catDone = cat.problems.filter((p) => done.has(p.slug)).length;
          return (
            <div key={cat.name} className="mb-1">
              <button
                onClick={() => {
                  const next = new Set(closed);
                  if (next.has(cat.name)) next.delete(cat.name);
                  else next.add(cat.name);
                  setClosed(next);
                }}
                className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-[11px] font-medium uppercase tracking-wider text-ink-faint hover:text-ink-dim"
              >
                <ChevronIcon open={isOpen} />
                <span className="truncate">{cat.name}</span>
                <span className="ml-auto font-mono normal-case tracking-normal">
                  {catDone}/{cat.problems.length}
                </span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.ul
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden"
                  >
                    {cat.problems.map((p) => {
                      const available = AVAILABLE.has(p.slug);
                      const active = p.slug === selected;
                      const isDone = done.has(p.slug);
                      return (
                        <li key={p.slug} className="relative">
                          {active && (
                            <motion.div
                              layoutId="sidebar-active"
                              className="absolute inset-0 rounded-lg bg-accent/10 shadow-[inset_0_0_0_1px_rgb(124_156_255/0.25)]"
                              transition={{ type: "spring", stiffness: 500, damping: 40 }}
                            />
                          )}
                          <div className="relative flex items-center gap-2 px-2 py-1">
                            <button
                              onClick={() => toggle(p.slug)}
                              aria-label={isDone ? `Mark ${p.title} not done` : `Mark ${p.title} done`}
                              className={`grid size-4 shrink-0 place-items-center rounded border transition ${
                                isDone ? "border-p-emerald bg-p-emerald text-bg" : "border-white/15 hover:border-white/35"
                              }`}
                            >
                              {isDone && <CheckIcon />}
                            </button>
                            <button
                              disabled={!available}
                              onClick={() => onSelect(p.slug)}
                              title={available ? p.title : `${p.title} (coming soon)`}
                              className={`flex min-w-0 flex-1 items-center gap-2 text-left text-[13px] ${
                                active ? "text-ink" : available ? "text-ink-dim hover:text-ink" : "cursor-default text-ink-faint/60"
                              }`}
                            >
                              <span className={`truncate ${isDone && !active ? "line-through decoration-white/20" : ""}`}>{p.title}</span>
                              {!available && <span className="ml-auto shrink-0 text-[9px] uppercase tracking-wider text-ink-faint/50">soon</span>}
                            </button>
                            {available && (
                              <span className="size-1.5 shrink-0 rounded-full" title={p.difficulty} style={{ background: DIFF_COLOR[p.difficulty] }} />
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>
    </div>
  );
}

export { DIFF_COLOR };

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import LineTab from "./tabs/LineTab";
import PatternTab from "./tabs/PatternTab";
import NotesTab from "./tabs/NotesTab";
import BruteForceTab from "./tabs/BruteForceTab";
import GlossaryTab from "./tabs/GlossaryTab";

const TABS = [
  { id: "line", label: "Line", C: LineTab },
  { id: "pattern", label: "Pattern", C: PatternTab },
  { id: "notes", label: "Notes", C: NotesTab },
  { id: "brute", label: "Brute Force", C: BruteForceTab },
  { id: "glossary", label: "Glossary", C: GlossaryTab },
] as const;

export default function Tabs() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("line");
  const Active = TABS.find((t) => t.id === tab)!.C;
  return (
    <div className="flex h-full flex-col">
      <div role="tablist" className="flex shrink-0 gap-1 border-b border-line px-3">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`relative px-3 py-2.5 text-[13px] font-medium transition ${tab === t.id ? "text-ink" : "text-ink-faint hover:text-ink-dim"}`}
          >
            {t.label}
            {tab === t.id && (
              <motion.span layoutId="tab-underline" className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent shadow-[0_0_10px_rgb(124_156_255/0.8)]" />
            )}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="p-4"
          >
            <Active />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

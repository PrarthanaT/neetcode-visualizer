import { createContext, useContext, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

/** Glossary for the current problem, so any text can link its terms. */
export const GlossaryContext = createContext<Record<string, string>>({});

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function useTermMatcher() {
  const glossary = useContext(GlossaryContext);
  return useMemo(() => {
    const terms = Object.keys(glossary).sort((a, b) => b.length - a.length);
    if (!terms.length) return null;
    const lookup = new Map(terms.map((t) => [t.toLowerCase(), t]));
    const pat = terms.map((t) => (/^[A-Za-z]/.test(t) ? `(?<![A-Za-z_])${escape(t)}` : escape(t))).join("|");
    const re = new RegExp(`(${pat})(?:s|es)?(?![A-Za-z_])`, "gi");
    return { re, lookup, glossary };
  }, [glossary]);
}

/** Plain-English text where each glossary term (first use only) gets a dotted underline and a hover definition. */
export function Prose({ text, className }: { text: string; className?: string }) {
  const m = useTermMatcher();
  const parts = useMemo(() => {
    if (!m) return [text];
    const out: React.ReactNode[] = [];
    const seen = new Set<string>();
    let last = 0;
    for (const match of text.matchAll(m.re)) {
      const term = m.lookup.get(match[1].toLowerCase());
      // capitalised terms like None or KeyError only match exactly
      if (!term || seen.has(term) || (/[A-Z]/.test(term) && term !== "Big O" && match[1] !== term)) continue;
      seen.add(term);
      out.push(text.slice(last, match.index));
      out.push(<Term key={match.index} word={match[0]} definition={m.glossary[term]} term={term} />);
      last = match.index! + match[0].length;
    }
    out.push(text.slice(last));
    return out;
  }, [text, m]);
  return <span className={className}>{parts}</span>;
}

function Term({ word, term, definition }: { word: string; term: string; definition: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number; below: boolean } | null>(null);

  const show = () => {
    const r = ref.current!.getBoundingClientRect();
    const below = r.top < 140;
    setPos({ x: Math.min(Math.max(r.left + r.width / 2, 150), window.innerWidth - 150), y: below ? r.bottom + 8 : r.top - 8, below });
  };

  return (
    <>
      <span
        ref={ref}
        tabIndex={0}
        onMouseEnter={show}
        onMouseLeave={() => setPos(null)}
        onFocus={show}
        onBlur={() => setPos(null)}
        className="cursor-help underline decoration-accent/50 decoration-dotted underline-offset-[3px] hover:decoration-accent"
      >
        {word}
      </span>
      {createPortal(
        <AnimatePresence>
          {pos && (
            <motion.div
              initial={{ opacity: 0, y: pos.below ? -4 : 4, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="pointer-events-none fixed z-50 w-72 -translate-x-1/2 rounded-xl border border-line-strong bg-[#1b1b20]/95 p-3 text-[13px] leading-relaxed text-ink-dim shadow-2xl backdrop-blur"
              style={{ left: pos.x, top: pos.y, translateY: pos.below ? 0 : "-100%" }}
            >
              <div className="mb-1 text-xs font-semibold text-accent">{term}</div>
              {definition}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}

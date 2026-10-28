import { AnimatePresence, motion } from "framer-motion";
import type { PanelSpec } from "../types/problem";
import type { Plain } from "../types/trace";
import type { RendererProps } from "./types";
import { fmtPlain } from "../lib/format";
import { MARK, glow, tint } from "../lib/colors";
import { Empty, PanelTitle } from "./ArrayRenderer";

type MapSpec = Extract<PanelSpec, { type: "hashmap" }>;

export default function HashMapRenderer({ spec, get, getPrev, cursor }: RendererProps<MapSpec>) {
  const raw = get("source");
  if (!Array.isArray(raw)) return <Empty title={spec.title} text="not created yet" />;

  const entries = raw.filter((e): e is [Plain, Plain] => Array.isArray(e) && e.length === 2);
  const prevRaw = getPrev("source");
  const prev = new Map(
    (Array.isArray(prevRaw) ? prevRaw : []).filter(Array.isArray).map((e) => [fmtPlain((e as Plain[])[0]), fmtPlain((e as Plain[])[1])]),
  );

  const lookup = get("lookup");
  const lookupKey = lookup === null || lookup === undefined ? null : fmtPlain(lookup);
  const hit = lookupKey !== null && entries.some(([k]) => fmtPlain(k) === lookupKey);

  return (
    <div>
      <PanelTitle
        title={spec.title}
        extra={
          <span className="normal-case tracking-normal text-ink-faint/70">
            {entries.length} {entries.length === 1 ? "entry" : "entries"} · key → value
          </span>
        }
      />
      <div className="flex min-h-[52px] flex-wrap items-start gap-2 rounded-xl border border-line bg-white/[0.02] p-2.5">
        <AnimatePresence initial={false}>
          {entries.length === 0 && lookupKey === null && (
            <motion.span key="__empty" className="self-center px-1 font-mono text-xs text-ink-faint" exit={{ opacity: 0 }}>
                {"{ }"} empty
            </motion.span>
          )}
          {entries.map(([k, v]) => {
            const key = fmtPlain(k);
            const val = fmtPlain(v);
            const isNew = Array.isArray(prevRaw) && !prev.has(key);
            const changed = prev.has(key) && prev.get(key) !== val;
            const isHit = hit && key === lookupKey;
            return (
              <motion.div
                key={key}
                layout
                initial={{ opacity: 0, scale: 0.6, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="relative flex items-stretch overflow-hidden rounded-lg font-mono text-[13px]"
                style={{ boxShadow: `inset 0 0 0 1px ${isHit ? MARK.found : isNew ? tint("#7c9cff", 0.6) : "rgb(255 255 255 / 0.1)"}` }}
              >
                {isHit && (
                  <motion.span
                    key={`flash-${cursor}`}
                    className="pointer-events-none absolute inset-0 rounded-lg"
                    initial={{ opacity: 0.9, boxShadow: glow(MARK.found, 0.9, 26) }}
                    animate={{ opacity: [0.9, 0.3, 0.9, 0.5], backgroundColor: tint(MARK.found, 0.18) }}
                    transition={{ duration: 0.9 }}
                  />
                )}
                <span className="relative bg-white/[0.05] px-2 py-1 text-p-sky">{key}</span>
                <span className="relative px-1 py-1 text-ink-faint">→</span>
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={val}
                    className="relative py-1 pr-2 text-ink"
                    initial={changed ? { y: 12, opacity: 0 } : false}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -12, opacity: 0 }}
                    transition={{ duration: 0.22 }}
                  >
                    {val}
                  </motion.span>
                </AnimatePresence>
              </motion.div>
            );
          })}
          {lookupKey !== null && !hit && (
            <motion.div
              key={`miss-${cursor}`}
              layout
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1.5 rounded-lg border border-dashed px-2 py-1 font-mono text-[12px]"
              style={{ borderColor: tint(MARK.miss, 0.6), color: MARK.miss, background: tint(MARK.miss, 0.07) }}
            >
              {lookupKey} <span className="font-sans text-[11px] opacity-80">not in map</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

import { motion } from "framer-motion";
import type { PanelSpec } from "../types/problem";
import type { RendererProps } from "./types";
import { asIndex, asIndexList } from "../lib/format";
import { MARK, WATER, glow, pointerColor, tint } from "../lib/colors";
import { Empty, PanelTitle } from "./ArrayRenderer";

const CELL = 36;
const GAP = 6;
const CHIP_ROW = 22;
const MAX_BAR_H = 128;

type BarsSpec = Extract<PanelSpec, { type: "bars" }>;

/** Bars sized to their value, with an optional translucent water/area overlay on top. */
export default function BarsRenderer({ spec, get }: RendererProps<BarsSpec>) {
  const raw = get("source");
  const items = Array.isArray(raw) ? raw.filter((v): v is number => typeof v === "number") : null;

  if (!items || !items.length) return <Empty title={spec.title} text="not created yet" />;

  const waterRaw = spec.water ? get("water") : undefined;
  const water = Array.isArray(waterRaw) ? waterRaw : null;

  const compared = new Set(asIndexList(get("mark.compared")));
  const found = new Set(asIndexList(get("mark.found")));
  const done = new Set(asIndexList(get("mark.done")));

  // pointer label -> index, grouped so labels on the same bar stack instead of overlapping
  const pointers = Object.keys(spec.pointers ?? {}).map((label, i) => ({
    label,
    color: pointerColor(i),
    index: asIndex(get(`ptr.${label}`)),
  }));
  const stackAt = new Map<number, number>();
  const placed = pointers
    .filter((p) => p.index !== null && p.index! >= 0 && p.index! < items.length)
    .map((p) => {
      const level = stackAt.get(p.index!) ?? 0;
      stackAt.set(p.index!, level + 1);
      return { ...p, level };
    });
  const levels = Math.max(1, ...Array.from(stackAt.values()));

  const waterNums = (water ?? []).filter((v): v is number => typeof v === "number");
  const maxVal = Math.max(1, ...items, ...waterNums);
  const scale = MAX_BAR_H / maxVal;
  const width = items.length * CELL + Math.max(0, items.length - 1) * GAP;

  return (
    <div>
      <PanelTitle title={spec.title} />
      <div className="overflow-x-auto pb-1">
        <div className="relative mx-auto" style={{ width: Math.max(width, CELL), paddingTop: levels * CHIP_ROW + 6 }}>
          {/* pointer chips */}
          {placed.map((p) => (
            <motion.div
              key={p.label}
              className="absolute flex justify-center"
              style={{ width: CELL, top: (levels - 1 - p.level) * CHIP_ROW }}
              initial={false}
              animate={{ x: p.index! * (CELL + GAP) }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
            >
              <span
                className="flex items-center gap-0.5 rounded-md px-1.5 font-mono text-[11px] font-semibold leading-[18px]"
                style={{ color: p.color, background: tint(p.color, 0.14), boxShadow: `inset 0 0 0 1px ${tint(p.color, 0.35)}` }}
              >
                {p.label}
                <span className="text-[9px] opacity-70">▼</span>
              </span>
            </motion.div>
          ))}

          {/* bars */}
          <div className="flex items-end" style={{ gap: GAP }}>
            {items.map((v, i) => {
              const ptr = placed.find((p) => p.index === i);
              const isFound = found.has(i);
              const isCompared = compared.has(i) && !isFound;
              const isDone = done.has(i) && !isFound && !isCompared;
              const barH = Math.max(2, v * scale);
              const level = water && typeof water[i] === "number" ? Math.max(v, water[i] as number) : v;
              const waterH = Math.max(0, level - v) * scale;
              const border = isFound ? MARK.found : isCompared ? MARK.compared : ptr ? tint(ptr.color, 0.6) : "rgb(255 255 255 / 0.12)";
              return (
                <div key={i} className="flex flex-col items-center gap-1.5" style={{ width: CELL }}>
                  <span className="font-mono text-[10px] text-ink-faint" style={{ color: isFound ? MARK.found : undefined }}>
                    {v}
                  </span>
                  <div className="relative flex flex-col justify-end" style={{ width: CELL, height: MAX_BAR_H }}>
                    {waterH > 0 && (
                      <motion.div
                        className="absolute w-full rounded-t-[3px]"
                        initial={false}
                        animate={{ height: waterH, bottom: barH }}
                        transition={{ duration: 0.28, ease: "easeOut" }}
                        style={{ background: tint(WATER, 0.3), boxShadow: `inset 0 0 0 1px ${tint(WATER, 0.5)}` }}
                      />
                    )}
                    <motion.div
                      className="w-full rounded-t-[3px]"
                      initial={false}
                      animate={{
                        height: barH,
                        backgroundColor: isFound ? tint(MARK.found, 0.18) : isCompared ? tint(MARK.compared, 0.14) : "rgb(255 255 255 / 0.06)",
                        boxShadow: `inset 0 0 0 1.5px ${border}${isFound ? `, ${glow(MARK.found, 0.6, 18)}` : isCompared ? `, ${glow(MARK.compared, 0.35, 14)}` : ""}`,
                        opacity: isDone ? 0.4 : 1,
                      }}
                      transition={{ duration: 0.28, ease: "easeOut" }}
                    />
                  </div>
                  <span className="font-mono text-[10px] text-ink-faint">{i}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <Legend compared={compared.size > 0} found={found.size > 0} done={done.size > 0} water={waterNums.length > 0} />
    </div>
  );
}

function Legend(props: { compared: boolean; found: boolean; done: boolean; water: boolean }) {
  const items = [
    props.compared && { c: MARK.compared, t: "looking at" },
    props.found && { c: MARK.found, t: "found" },
    props.done && { c: "#52525b", t: "done" },
    props.water && { c: WATER, t: "water" },
  ].filter(Boolean) as { c: string; t: string }[];
  if (!items.length) return null;
  return (
    <div className="mt-2 flex justify-center gap-3 text-[10px] text-ink-faint">
      {items.map((x) => (
        <span key={x.t} className="flex items-center gap-1">
          <span className="size-2 rounded-full" style={{ background: x.c }} />
          {x.t}
        </span>
      ))}
    </div>
  );
}

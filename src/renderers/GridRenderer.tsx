import { motion } from "framer-motion";
import type { PanelSpec } from "../types/problem";
import type { Plain } from "../types/trace";
import type { RendererProps } from "./types";
import { asCell, asCellList, fmtPlain } from "../lib/format";
import { MARK, glow, pointerColor, tint } from "../lib/colors";
import { Empty, PanelTitle } from "./ArrayRenderer";

const CELL = 30;

type GridSpec = Extract<PanelSpec, { type: "grid" }>;

/** A 2D board. Thicker borders mark 3x3 boxes when the grid is 9x9 (or any multiple of 3). */
export default function GridRenderer({ spec, get }: RendererProps<GridSpec>) {
  const raw = get("source");
  const rows = Array.isArray(raw) ? raw.filter((r): r is Plain[] => Array.isArray(r)) : null;

  if (!rows || !rows.length) return <Empty title={spec.title} text="not created yet" />;

  const nRows = rows.length;
  const nCols = Math.max(...rows.map((r) => r.length));
  const boxH = nRows % 3 === 0 ? 3 : nRows;
  const boxW = nCols % 3 === 0 ? 3 : nCols;

  const cursor = asCell(get("cursor"));
  const rowHighlight = typeof get("rowHighlight") === "number" ? (get("rowHighlight") as number) : null;
  const colHighlight = typeof get("colHighlight") === "number" ? (get("colHighlight") as number) : null;
  const boxHighlight = asCell(get("boxHighlight"));

  const compared = new Set(asCellList(get("mark.compared")).map(([r, c]) => `${r},${c}`));
  const found = new Set(asCellList(get("mark.found")).map(([r, c]) => `${r},${c}`));
  const done = new Set(asCellList(get("mark.done")).map(([r, c]) => `${r},${c}`));

  const rowColor = pointerColor(0);
  const colColor = pointerColor(1);
  const boxColor = pointerColor(2);

  return (
    <div>
      <PanelTitle title={spec.title} />
      <div className="flex justify-center">
        <div
          className="grid rounded-lg bg-white/[0.02]"
          style={{ gridTemplateColumns: `repeat(${nCols}, ${CELL}px)`, gridTemplateRows: `repeat(${nRows}, ${CELL}px)` }}
        >
          {rows.map((row, r) =>
            row.map((v, c) => {
              const key = `${r},${c}`;
              const isCursor = cursor?.[0] === r && cursor?.[1] === c;
              const isFound = found.has(key);
              const isCompared = compared.has(key) && !isFound;
              const isDone = done.has(key) && !isFound && !isCompared;
              const inRow = rowHighlight === r;
              const inCol = colHighlight === c;
              const inBox = boxHighlight !== null && Math.floor(r / boxH) === boxHighlight[0] && Math.floor(c / boxW) === boxHighlight[1];

              let bg = "transparent";
              if (isFound) bg = tint(MARK.found, 0.22);
              else if (isCompared) bg = tint(MARK.compared, 0.18);
              else if (inRow && inCol) bg = tint(colColor, 0.16);
              else if (inRow) bg = tint(rowColor, 0.1);
              else if (inCol) bg = tint(colColor, 0.1);
              else if (inBox) bg = tint(boxColor, 0.08);

              const empty = v === "." || v === null || v === "";
              return (
                <motion.div
                  key={key}
                  className="relative flex items-center justify-center font-mono text-[14px] font-semibold"
                  style={{
                    borderTop: `1px solid ${r % boxH === 0 ? "rgb(255 255 255 / 0.22)" : "rgb(255 255 255 / 0.07)"}`,
                    borderLeft: `1px solid ${c % boxW === 0 ? "rgb(255 255 255 / 0.22)" : "rgb(255 255 255 / 0.07)"}`,
                    borderRight: c === nCols - 1 ? "1px solid rgb(255 255 255 / 0.22)" : undefined,
                    borderBottom: r === nRows - 1 ? "1px solid rgb(255 255 255 / 0.22)" : undefined,
                  }}
                  initial={false}
                  animate={{ backgroundColor: bg, opacity: isDone ? 0.5 : 1 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  {isCursor && (
                    <motion.div
                      layoutId={`${spec.title}-cursor`}
                      className="absolute inset-0.5 rounded-sm"
                      style={{ boxShadow: `inset 0 0 0 2px ${MARK.compared}, ${glow(MARK.compared, 0.5, 10)}` }}
                      transition={{ type: "spring", stiffness: 500, damping: 34 }}
                    />
                  )}
                  <span className="relative" style={{ color: isFound ? MARK.found : empty ? "var(--color-ink-faint)" : "var(--color-ink)" }}>
                    {empty ? "" : typeof v === "string" ? v : fmtPlain(v)}
                  </span>
                </motion.div>
              );
            }),
          )}
        </div>
      </div>
      <Legend row={rowHighlight !== null} col={colHighlight !== null} box={boxHighlight !== null} rowColor={rowColor} colColor={colColor} boxColor={boxColor} />
    </div>
  );
}

function Legend(props: { row: boolean; col: boolean; box: boolean; rowColor: string; colColor: string; boxColor: string }) {
  const items = [
    props.row && { c: props.rowColor, t: "row" },
    props.col && { c: props.colColor, t: "column" },
    props.box && { c: props.boxColor, t: "3×3 box" },
  ].filter(Boolean) as { c: string; t: string }[];
  if (!items.length) return null;
  return (
    <div className="mt-2 flex justify-center gap-3 text-[10px] text-ink-faint">
      {items.map((x) => (
        <span key={x.t} className="flex items-center gap-1">
          <span className="size-2 rounded-full" style={{ background: x.c }} />
          {x.t} being checked
        </span>
      ))}
    </div>
  );
}

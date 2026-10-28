import type { Problem } from "../types/problem";

/** Every Python expression the visualizer panels need, keyed by where it is used.
 *  Mirror of collect_exprs in scripts/check_problems.py. */
export function collectExprs(problem: Problem): Record<string, string> {
  const exprs: Record<string, string> = {};
  problem.visualizer.forEach((panel, i) => {
    if (panel.source) exprs[`${i}.source`] = panel.source;
    if ("pointers" in panel && panel.pointers)
      for (const [name, expr] of Object.entries(panel.pointers)) exprs[`${i}.ptr.${name}`] = expr;
    if ("marks" in panel && panel.marks)
      for (const [name, expr] of Object.entries(panel.marks)) if (expr) exprs[`${i}.mark.${name}`] = expr;
    if ("lookup" in panel && panel.lookup) exprs[`${i}.lookup`] = panel.lookup;
  });
  return exprs;
}

export function collectCaptions(problem: Problem) {
  const captions: Record<string, unknown> = {};
  for (const [line, info] of Object.entries(problem.lines)) if (info.caption) captions[line] = info.caption;
  return captions;
}

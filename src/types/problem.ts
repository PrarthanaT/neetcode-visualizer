// Shape of a src/problems/<slug>.json file.

export type Difficulty = "Easy" | "Medium" | "Hard";

export type CaptionOption = string | { when?: string; text: string };

export interface SyntaxPiece {
  token: string;
  meaning: string;
}

export interface Alternative {
  code: string;
  difference: string;
}

export interface LineInfo {
  explain: string;
  syntax: SyntaxPiece[];
  why: string;
  if_removed: string;
  alternatives: Alternative[];
  mistake: string;
  /** Template for the step caption. {python expression} is filled in by the tracer. */
  caption?: string | CaptionOption[];
}

export type PanelSpec =
  | {
      type: "array";
      title: string;
      /** Python expression giving the list to draw. */
      source: string;
      /** label -> Python expression giving an index. */
      pointers?: Record<string, string>;
      /** compared | found | done -> Python expression giving a list of indexes. */
      marks?: Partial<Record<MarkKind, string>>;
    }
  | {
      type: "hashmap";
      title: string;
      source: string;
      /** Python expression giving the key being looked up on this step, or None. */
      lookup?: string;
    }
  | { type: "stack"; title: string; source: string; marks?: Partial<Record<MarkKind, string>> }
  | {
      type: "bars";
      title: string;
      /** Python expression giving the list of bar heights to draw. */
      source: string;
      /** label -> Python expression giving an index. */
      pointers?: Record<string, string>;
      /** compared | found | done -> Python expression giving a list of indexes. */
      marks?: Partial<Record<MarkKind, string>>;
      /** Python expression giving, per bar, the absolute level water/area sits at.
       *  Only drawn where it's above that bar's own height. */
      water?: string;
    }
  | {
      type: "linkedlist";
      title: string;
      /** Name of the node class to draw, e.g. "ListNode". Every reachable node of this class is drawn. */
      node_class: string;
      /** Field holding the node's value / the next node. Default "val" and "next". */
      val_field?: string;
      next_field?: string;
      /** label -> Python expression giving a node or None. Return HIDE to hide the pointer on a step. */
      pointers?: Record<string, string>;
      /** Pointer labels whose None should sit at the left end instead of the right. */
      null_left?: string[];
      source?: undefined;
    }
  | {
      type: "grid";
      title: string;
      /** Python expression giving a 2D list (rows of cells) to draw. */
      source: string;
      /** Python expression giving [row, col] of the active cell, or None. */
      cursor?: string;
      /** Python expression giving the row index to outline, or None. */
      rowHighlight?: string;
      /** Python expression giving the column index to outline, or None. */
      colHighlight?: string;
      /** Python expression giving [boxRow, boxCol] of the 3x3 box to outline, or None. */
      boxHighlight?: string;
      /** compared | found | done -> Python expression giving a list of [row, col] pairs. */
      marks?: Partial<Record<MarkKind, string>>;
    };

export type MarkKind = "compared" | "found" | "done";

export interface Problem {
  slug: string;
  title: string;
  difficulty: Difficulty;
  category: string;
  leetcode?: number;
  statement: string[];
  examples?: { input: string; output: string; explain: string }[];
  pattern: {
    name: string;
    summary: string;
    recognize: string[];
    avoid_when: string[];
  };
  notes: {
    takeaways: string[];
    time: string;
    space: string;
    edge_cases: string[];
  };
  code: string;
  run: {
    prelude?: string;
    call: string;
    /** Expression turning __result__ into plain data for comparison. */
    check?: string;
    expected: unknown;
    /** Plain-English description of the sample input. */
    describe?: string;
  };
  lines: Record<string, LineInfo>;
  brute_force: {
    code: string;
    explain: string;
    why_slow: string;
    how_pattern_fixes: string;
    time: string;
    space: string;
  };
  glossary: Record<string, string>;
  visualizer: PanelSpec[];
}

export interface ProblemIndexEntry {
  slug: string;
  title: string;
  difficulty: Difficulty;
  category: string;
}

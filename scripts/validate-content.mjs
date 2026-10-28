// Checks every problem JSON for completeness:
//  - required sections exist and aren't empty
//  - every non-blank code line has a full `lines` entry (and no entries point at missing lines)
//  - every technical term used anywhere in the text is defined in that problem's glossary
// Usage: npm run validate
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "problems");
const files = readdirSync(dir).filter((f) => f.endsWith(".json") && f !== "index.json");
const index = JSON.parse(readFileSync(join(dir, "index.json"), "utf8"));
const problems = files.map((f) => ({ file: f, p: JSON.parse(readFileSync(join(dir, f), "utf8")) }));

// Terms that must be defined whenever they appear, plus every term any problem defines.
const BASE_TERMS = [
  "algorithm", "argument", "assignment", "Big O", "boolean", "brute force", "class", "comment", "condition",
  "dictionary", "expression", "function", "hash map", "index", "indentation", "integer", "keyword", "list",
  "loop", "method", "object", "operator", "parameter", "pointer", "recursion", "return", "self", "set",
  "stack", "string", "tuple", "type hint", "variable", "node", "linked list", "KeyError", "IndexError",
  "TypeError", "NameError", "SyntaxError", "None",
];
const known = new Set(BASE_TERMS);
for (const { p } of problems) for (const t of Object.keys(p.glossary ?? {})) known.add(t);

const LINE_FIELDS = ["explain", "syntax", "why", "if_removed", "alternatives", "mistake", "caption"];
let failures = 0;
const fail = (file, msg) => {
  failures++;
  console.log(`  ✗ ${file}: ${msg}`);
};

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const termRegex = (t) => {
  const caseSensitive = /[A-Z]/.test(t) && t !== "Big O";
  const before = /^[A-Za-z]/.test(t) ? "(^|[^A-Za-z_])" : "";
  return new RegExp(`${before}${escape(t)}(s|es)?(?![A-Za-z_])`, caseSensitive ? "" : "i");
};

/** All human-readable text in a problem, excluding code and the glossary itself. */
function proseOf(p) {
  const out = [...(p.statement ?? []), p.pattern?.summary, ...(p.pattern?.recognize ?? []), ...(p.pattern?.avoid_when ?? [])];
  out.push(...(p.notes?.takeaways ?? []), p.notes?.time, p.notes?.space, ...(p.notes?.edge_cases ?? []));
  for (const e of p.examples ?? []) out.push(e.explain);
  for (const l of Object.values(p.lines ?? {})) {
    out.push(l.explain, l.why, l.if_removed, l.mistake);
    for (const s of l.syntax ?? []) out.push(s.meaning);
    for (const a of l.alternatives ?? []) out.push(a.difference);
  }
  const b = p.brute_force ?? {};
  out.push(b.explain, b.why_slow, b.how_pattern_fixes, b.time, b.space);
  return out.filter(Boolean).join("\n");
}

const slugs = new Set(index.map((e) => e.slug));
for (const { file, p } of problems) {
  console.log(p.slug);
  if (`${p.slug}.json` !== file) fail(file, `slug "${p.slug}" doesn't match the file name`);
  if (!slugs.has(p.slug)) fail(file, `slug isn't listed in index.json`);
  for (const k of ["title", "difficulty", "category", "statement", "pattern", "notes", "code", "run", "lines", "brute_force", "glossary", "visualizer"])
    if (!p[k] || (Array.isArray(p[k]) && !p[k].length)) fail(file, `missing ${k}`);
  for (const k of ["name", "summary", "recognize", "avoid_when"]) if (!p.pattern?.[k]?.length) fail(file, `pattern.${k} is empty`);
  for (const k of ["takeaways", "time", "space", "edge_cases"]) if (!p.notes?.[k]?.length) fail(file, `notes.${k} is empty`);
  for (const k of ["code", "explain", "why_slow", "how_pattern_fixes", "time", "space"]) if (!p.brute_force?.[k]) fail(file, `brute_force.${k} is empty`);

  const codeLines = p.code.replace(/\n+$/, "").split("\n");
  codeLines.forEach((text, i) => {
    if (!text.trim()) return;
    const info = p.lines[String(i + 1)];
    if (!info) return fail(file, `line ${i + 1} has no entry: ${text.trim()}`);
    for (const f of LINE_FIELDS) if (!info[f] || (Array.isArray(info[f]) && !info[f].length)) fail(file, `line ${i + 1} is missing ${f}`);
  });
  for (const n of Object.keys(p.lines))
    if (!codeLines[+n - 1]?.trim()) fail(file, `lines has an entry for line ${n}, which is blank or doesn't exist`);

  const prose = proseOf(p);
  const glossary = new Set(Object.keys(p.glossary ?? {}).map((t) => t.toLowerCase()));
  for (const term of known) {
    if (glossary.has(term.toLowerCase())) continue;
    if (termRegex(term).test(prose)) fail(file, `uses "${term}" but the glossary doesn't define it`);
  }
  if (/O\(/.test(prose) && !glossary.has("big o")) fail(file, `uses O(...) notation but doesn't define Big O`);
}

console.log(failures ? `\n${failures} problem(s) found` : "\nall content complete");
process.exit(failures ? 1 : 0);

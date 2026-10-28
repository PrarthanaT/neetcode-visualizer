// Runs tracer.py inside real Pyodide (under Node) for every problem, to catch
// differences between local python3 and the Python version the browser uses.
// Usage: npm run check:pyodide [-- -v]
import { loadPyodide } from "pyodide";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const py = await loadPyodide({ indexURL: root + "/node_modules/pyodide/" });
console.log("python", py.runPython("import sys; sys.version"));
py.runPython(readFileSync(root + "/src/python/tracer.py", "utf8"));
for (const f of readdirSync(root + "/src/problems").filter((f) => f.endsWith(".json") && f !== "index.json")) {
  const p = JSON.parse(readFileSync(`${root}/src/problems/${f}`, "utf8"));
  const exprs = {};
  p.visualizer.forEach((v, i) => {
    if (v.source) exprs[`${i}.source`] = v.source;
    for (const [k, e] of Object.entries(v.pointers ?? {})) exprs[`${i}.ptr.${k}`] = e;
    for (const [k, e] of Object.entries(v.marks ?? {})) exprs[`${i}.mark.${k}`] = e;
    if (v.lookup) exprs[`${i}.lookup`] = v.lookup;
  });
  const captions = Object.fromEntries(Object.entries(p.lines).filter(([, v]) => v.caption).map(([k, v]) => [k, v.caption]));
  const out = JSON.parse(py.globals.get("run_json")(JSON.stringify({ code: p.code, prelude: p.run.prelude, call: p.run.call, check: p.run.check, captions, exprs })));
  if (!ok_or(out)) process.exitCode = 1;
  const ok = JSON.stringify(out.result) === JSON.stringify(p.run.expected) && !out.error && !out.truncated;
  const nocap = out.steps.filter((s) => s.caption == null).map((s) => s.line);
  console.log(f.padEnd(28), String(out.steps.length).padStart(4), "steps", ok ? "ok" : "FAIL " + JSON.stringify(out.error ?? out.result), nocap.length ? "no caption on " + nocap : "");
  if (process.argv[2] === "-v") for (const s of out.steps) console.log("  ", s.event, s.line, s.frames.map((f) => f.name).join(">"), "|", s.caption);
}

function ok_or(out) {
  return !out.error && !out.truncated && out.steps.every((s) => s.caption != null);
}

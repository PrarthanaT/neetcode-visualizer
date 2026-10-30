"""Runs every problem through the tracer with the local python3.

Checks: the solution returns `run.expected`, stays under the step cap,
every captioned line produced a caption, and every visualizer expression
evaluates on at least one step. Usage: python3 scripts/check_problems.py [slug]
"""

import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "src", "python"))

import tracer  # noqa: E402

PROBLEMS = os.path.join(ROOT, "src", "problems")


def collect_exprs(problem):
    """Mirror of collectExprs in src/lib/exprs.ts."""
    exprs = {}
    for i, panel in enumerate(problem.get("visualizer", [])):
        if panel.get("source"):
            exprs["{}.source".format(i)] = panel["source"]
        for name, expr in (panel.get("pointers") or {}).items():
            exprs["{}.ptr.{}".format(i, name)] = expr
        for name, expr in (panel.get("marks") or {}).items():
            exprs["{}.mark.{}".format(i, name)] = expr
        if panel.get("lookup"):
            exprs["{}.lookup".format(i)] = panel["lookup"]
        if panel.get("water"):
            exprs["{}.water".format(i)] = panel["water"]
        if panel.get("cursor"):
            exprs["{}.cursor".format(i)] = panel["cursor"]
        if panel.get("rowHighlight"):
            exprs["{}.rowHighlight".format(i)] = panel["rowHighlight"]
        if panel.get("colHighlight"):
            exprs["{}.colHighlight".format(i)] = panel["colHighlight"]
        if panel.get("boxHighlight"):
            exprs["{}.boxHighlight".format(i)] = panel["boxHighlight"]
    return exprs


def check(path):
    with open(path) as f:
        p = json.load(f)
    problems = []
    run = p["run"]
    captions = {k: v["caption"] for k, v in p.get("lines", {}).items() if "caption" in v}
    exprs = collect_exprs(p)
    out = tracer.run({
        "code": p["code"], "prelude": run.get("prelude"), "call": run["call"],
        "check": run.get("check"), "captions": captions, "exprs": exprs,
    })
    json.dumps(out)  # must be serialisable

    if out["error"]:
        problems.append("error: {}".format(out["error"]))
    if out["truncated"]:
        problems.append("hit the {} step cap".format(tracer.MAX_STEPS))
    if out["result"] != run["expected"]:
        problems.append("returned {!r}, expected {!r}".format(out["result"], run["expected"]))

    missing = sorted({s["line"] for s in out["steps"]
                      if s["event"] == "line" and str(s["line"]) in captions and s["caption"] is None})
    if missing:
        problems.append("no caption could be built on line(s) {}".format(missing))
    uncaptioned = sorted({s["line"] for s in out["steps"] if s["caption"] is None} - set(map(int, captions)))
    if uncaptioned:
        problems.append("line(s) {} run but have no caption".format(uncaptioned))
    doubled = sorted({s["line"] for s in out["steps"] if s["caption"] and "''" in s["caption"]})
    if doubled:
        problems.append("caption on line(s) {} has doubled quotes: values are already quoted, so drop the ' around {{...}}".format(doubled))
    for key, expr in exprs.items():
        if all(s["viz"].get(key) is None for s in out["steps"]):
            problems.append("visualizer expression {} ({!r}) never evaluated".format(key, expr))

    status = "ok" if not problems else "FAIL"
    print("{:<28} {:>4} steps  {}".format(p["slug"], len(out["steps"]), status))
    for msg in problems:
        print("    - " + msg)
    return not problems


def main():
    only = sys.argv[1] if len(sys.argv) > 1 else None
    files = sorted(f for f in os.listdir(PROBLEMS) if f.endswith(".json") and f != "index.json")
    ok = True
    for f in files:
        if only and f != only + ".json":
            continue
        ok = check(os.path.join(PROBLEMS, f)) and ok
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()

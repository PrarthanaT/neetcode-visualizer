"""Step recorder for the visualizer.

Runs a solution under sys.settrace and records one snapshot per executed line:
the line number, every frame's local variables, the objects those variables
point to (the "heap", Python Tutor style), a plain-English caption, and the
values of any visualizer expressions. Works on Python 3.9+ so the same file
runs in Pyodide and under a local python3 for checks.
"""

import io
import json
import math
import sys

SOLUTION_FILE = "<solution>"
MAX_STEPS = 500
CO_OPTIMIZED = 0x0001  # set on function frames, not on module or class bodies


class StepLimit(Exception):
    pass


# ---------------------------------------------------------------- formatting

def fmt(value):
    """Beginner-friendly text for a value, used inside captions."""
    if value is None:
        return "None"
    if isinstance(value, bool):
        return "True" if value else "False"
    if isinstance(value, float):
        if math.isinf(value):
            return "infinity" if value > 0 else "minus infinity"
        return repr(value)
    if isinstance(value, (int, str)):
        return repr(value) if isinstance(value, str) else str(value)
    if isinstance(value, list):
        return "[" + ", ".join(fmt(v) for v in value) + "]"
    if isinstance(value, tuple):
        return "(" + ", ".join(fmt(v) for v in value) + ("," if len(value) == 1 else "") + ")"
    if isinstance(value, set):
        return "{" + ", ".join(fmt(v) for v in value) + "}" if value else "set()"
    if isinstance(value, dict):
        return "{" + ", ".join(fmt(k) + ": " + fmt(v) for k, v in value.items()) + "}"
    return repr(value)


def split_template(template):
    """Split 'a {x + 1} b' into [('text','a '), ('expr','x + 1'), ('text',' b')].

    Braces may nest, so expressions like {'yes' if d in {1: 2} else 'no'} work.
    """
    parts = []
    buf = ""
    depth = 0
    for ch in template:
        if ch == "{":
            if depth == 0:
                if buf:
                    parts.append(("text", buf))
                buf = ""
            else:
                buf += ch
            depth += 1
        elif ch == "}" and depth > 0:
            depth -= 1
            if depth == 0:
                parts.append(("expr", buf))
                buf = ""
            else:
                buf += ch
        else:
            buf += ch
    if buf:
        parts.append(("text", buf))
    return parts


def render_template(template, scope):
    """Fill a caption template. Raises if any expression can't be evaluated."""
    out = []
    for kind, piece in split_template(template):
        if kind == "text":
            out.append(piece)
        else:
            out.append(fmt(eval(piece, {"__builtins__": __builtins__}, scope)))
    return "".join(out)


def pick_caption(options, scope):
    """options: a string, or a list of strings / {"when": expr, "text": template}.

    Returns the first option whose condition holds and whose expressions all
    evaluate; None if nothing fits.
    """
    if options is None:
        return None
    if isinstance(options, str):
        options = [options]
    for opt in options:
        try:
            if isinstance(opt, dict):
                when = opt.get("when")
                if when and not eval(when, {"__builtins__": __builtins__}, scope):
                    continue
                return render_template(opt["text"], scope)
            return render_template(opt, scope)
        except Exception:
            continue
    return None


# ---------------------------------------------------------------- encoding

class Encoder:
    """Turns Python values into JSON. Containers and objects go to a heap
    keyed by a stable small id, so aliasing and linked structures survive."""

    def __init__(self):
        self.ids = {}
        self.keepalive = []  # stops id() reuse while the trace is running

    def ref_id(self, obj):
        key = id(obj)
        if key not in self.ids:
            self.ids[key] = str(len(self.ids) + 1)
            self.keepalive.append(obj)
        return self.ids[key]

    def value(self, obj, heap):
        if obj is None:
            return {"k": "none"}
        if isinstance(obj, bool):
            return {"k": "bool", "v": obj}
        if isinstance(obj, int):
            return {"k": "num", "v": obj}
        if isinstance(obj, float):
            if math.isinf(obj) or math.isnan(obj):
                return {"k": "num", "v": str(obj)}
            return {"k": "num", "v": obj}
        if isinstance(obj, str):
            return {"k": "str", "v": obj}
        rid = self.ref_id(obj)
        if rid not in heap:
            heap[rid] = None  # placeholder breaks cycles
            heap[rid] = self.heap_object(obj, heap)
        return {"k": "ref", "id": rid}

    def heap_object(self, obj, heap):
        if isinstance(obj, (list, tuple)):
            return {"type": type(obj).__name__, "items": [self.value(v, heap) for v in obj]}
        if isinstance(obj, (set, frozenset)):
            items = sorted(obj, key=lambda v: (type(v).__name__, repr(v)))
            return {"type": "set", "items": [self.value(v, heap) for v in items]}
        if isinstance(obj, dict):
            entries = [[self.value(k, heap), self.value(v, heap)] for k, v in obj.items()]
            return {"type": type(obj).__name__ if type(obj).__name__ != "dict" else "dict", "entries": entries}
        if isinstance(obj, type):
            return {"type": "class", "name": obj.__name__}
        if callable(obj) and hasattr(obj, "__name__"):
            return {"type": "func", "name": obj.__name__}
        fields = {}
        for name, v in getattr(obj, "__dict__", {}).items():
            if not name.startswith("_"):
                fields[name] = self.value(v, heap)
        return {"type": "obj", "cls": type(obj).__name__, "fields": fields}

    def plain(self, obj, depth=0):
        """JSON-native copy (no refs) for visualizer expressions."""
        if depth > 50:
            return None
        if obj is None or isinstance(obj, (bool, int, str)):
            return obj
        if isinstance(obj, float):
            return obj if math.isfinite(obj) else str(obj)
        if isinstance(obj, (list, tuple, set, frozenset)):
            return [self.plain(v, depth + 1) for v in obj]
        if isinstance(obj, dict):
            return [[self.plain(k, depth + 1), self.plain(v, depth + 1)] for k, v in obj.items()]
        if hasattr(obj, "__dict__") and not isinstance(obj, type):
            return {"ref": self.ref_id(obj)}
        return repr(obj)


# ---------------------------------------------------------------- tracing

class Tracer:
    def __init__(self, captions, exprs, hidden, globs):
        self.captions = captions  # {"5": template-or-options}
        self.exprs = exprs        # {"name": python expression}
        self.hidden = hidden      # global names to keep out of the frames view
        self.globs = globs        # the shared global namespace
        self.enc = Encoder()
        self.steps = []
        self.stdout = io.StringIO()
        self.visits = {}  # line -> times it has run so far, exposed to expressions as __visits__

    def is_solution(self, frame):
        return frame.f_code.co_filename == SOLUTION_FILE

    def visible(self, names, is_global):
        out = []
        for name, val in names.items():
            if name.startswith("__") or (is_global and name in self.hidden):
                continue
            if type(val).__name__ == "module":
                continue
            out.append((name, val))
        return out

    def snapshot(self, frame, event, arg):
        heap = {}
        chain = []
        f = frame
        while f is not None:
            if self.is_solution(f) and f.f_code.co_flags & CO_OPTIMIZED:
                chain.append(f)
            f = f.f_back
        chain.reverse()  # outermost first, like Python Tutor

        # Global always sits at the bottom of the stack, even after the
        # module body has finished and a function is called from the driver.
        frames = [{
            "name": "Global",
            "locals": [[n, self.enc.value(v, heap)] for n, v in self.visible(self.globs, True)],
        }]
        for f in chain:
            frames.append({
                "name": f.f_code.co_name,
                "locals": [[n, self.enc.value(v, heap)] for n, v in self.visible(dict(f.f_locals), False)],
            })

        scope = dict(frame.f_globals)
        scope.update(dict(frame.f_locals))
        scope["__line__"] = frame.f_lineno
        scope["__visits__"] = dict(self.visits)

        step = {
            "line": frame.f_lineno,
            "event": event,
            "frames": frames,
            "heap": heap,
            "out": self.stdout.getvalue(),
        }

        if event == "return":
            step["ret"] = self.enc.value(arg, heap)
            step["caption"] = "{} is done and gives back {}.".format(frame.f_code.co_name, fmt(arg))
        elif event == "call":
            args = frame.f_code.co_varnames[: frame.f_code.co_argcount]
            shown = ["{} = {}".format(a, fmt(frame.f_locals[a])) for a in args if a != "self" and a in frame.f_locals]
            step["caption"] = "We call {}{}.".format(
                frame.f_code.co_name, " with " + ", ".join(shown) if shown else "")
        else:
            step["caption"] = pick_caption(self.captions.get(str(frame.f_lineno)), scope)

        viz = {}
        for key, expr in self.exprs.items():
            try:
                viz[key] = self.enc.plain(eval(expr, {"__builtins__": __builtins__}, scope))
            except Exception:
                viz[key] = None
        step["viz"] = viz
        return step

    def record(self, frame, event, arg):
        if len(self.steps) >= MAX_STEPS:
            raise StepLimit()
        if event == "line":
            self.visits[frame.f_lineno] = self.visits.get(frame.f_lineno, 0) + 1
        self.steps.append(self.snapshot(frame, event, arg))

    def global_trace(self, frame, event, arg):
        if not self.is_solution(frame):
            return None
        if event == "call" and frame.f_code.co_flags & CO_OPTIMIZED:
            self.record(frame, "call", None)
        return self.local_trace

    def local_trace(self, frame, event, arg):
        if event == "line":
            # Python 3.9 reports a class's header line again inside its body.
            is_class_body = frame.f_code.co_name != "<module>" and not frame.f_code.co_flags & CO_OPTIMIZED
            if not (is_class_body and frame.f_lineno == frame.f_code.co_firstlineno):
                self.record(frame, "line", None)
        elif event == "return" and frame.f_code.co_flags & CO_OPTIMIZED:
            self.record(frame, "return", arg)
        return self.local_trace


def run(payload):
    """payload: {code, prelude, call, check, captions, exprs} -> result dict."""
    code = payload["code"]
    prelude = payload.get("prelude") or ""
    call = payload["call"]
    check = payload.get("check") or "__result__"

    g = {"__name__": "__main__", "__builtins__": __builtins__}
    exec(compile(prelude, "<prelude>", "exec"), g)
    hidden = set(g.keys())

    tracer = Tracer(payload.get("captions") or {}, payload.get("exprs") or {}, hidden, g)
    result = {"steps": tracer.steps, "truncated": False, "error": None, "result": None, "stdout": ""}

    real_stdout = sys.stdout
    sys.stdout = tracer.stdout
    sys.settrace(tracer.global_trace)
    try:
        exec(compile(code, SOLUTION_FILE, "exec"), g)
        exec(compile("__result__ = " + call, "<driver>", "exec"), g)
    except StepLimit:
        result["truncated"] = True
    except Exception as e:  # the solution itself crashed: show it as a step
        sys.settrace(None)
        tb = e.__traceback__
        line = None
        while tb is not None:
            if tb.tb_frame.f_code.co_filename == SOLUTION_FILE:
                line = tb.tb_lineno
            tb = tb.tb_next
        result["error"] = {"type": type(e).__name__, "message": str(e), "line": line}
    finally:
        sys.settrace(None)
        sys.stdout = real_stdout

    result["stdout"] = tracer.stdout.getvalue()
    if not result["truncated"] and result["error"] is None:
        try:
            result["result"] = tracer.enc.plain(eval(check, g))
        except Exception as e:
            result["error"] = {"type": type(e).__name__, "message": str(e), "line": None}
    return result


def run_json(payload_json):
    """Entry point used from JavaScript: JSON string in, JSON string out."""
    return json.dumps(run(json.loads(payload_json)))

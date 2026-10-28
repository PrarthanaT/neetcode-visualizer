import type { Problem } from "../types/problem";
import type { Trace } from "../types/trace";
import type { WorkerRequest, WorkerResponse } from "../worker/pyodide.worker";
import { collectCaptions, collectExprs } from "./exprs";

const worker = new Worker(new URL("../worker/pyodide.worker.ts", import.meta.url), { type: "module" });
const pending = new Map<number, { resolve: (t: Trace) => void; reject: (e: Error) => void }>();
let nextId = 1;
let readyListeners: (() => void)[] = [];
let ready = false;

worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
  const msg = e.data;
  if ("ready" in msg) {
    ready = true;
    readyListeners.forEach((f) => f());
    readyListeners = [];
    return;
  }
  const p = pending.get(msg.id);
  if (!p) return;
  pending.delete(msg.id);
  if (msg.ok) p.resolve(JSON.parse(msg.json));
  else p.reject(new Error(msg.message));
};

export function onPythonReady(f: () => void) {
  if (ready) f();
  else readyListeners.push(f);
}

export function traceProblem(problem: Problem): Promise<Trace> {
  const id = nextId++;
  const req: WorkerRequest = {
    id,
    payload: {
      code: problem.code,
      prelude: problem.run.prelude,
      call: problem.run.call,
      check: problem.run.check,
      captions: collectCaptions(problem),
      exprs: collectExprs(problem),
    },
  };
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    worker.postMessage(req);
  });
}

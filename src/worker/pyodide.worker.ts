/// <reference lib="webworker" />
// Runs Python off the main thread so the UI stays smooth while Pyodide loads and traces.
import tracerSource from "../python/tracer.py?raw";

type PyodideAPI = {
  runPython: (code: string) => unknown;
  globals: { get: (name: string) => (arg: string) => string };
};

export type WorkerRequest = { id: number; payload: unknown };
export type WorkerResponse =
  | { id: number; ok: true; json: string }
  | { id: number; ok: false; message: string }
  | { id: -1; ready: true };

let pyodide: Promise<PyodideAPI> | null = null;

function load(): Promise<PyodideAPI> {
  if (!pyodide) {
    pyodide = (async () => {
      const base = new URL(`${import.meta.env.BASE_URL}pyodide/`, self.location.origin).href;
      const mod = await import(/* @vite-ignore */ `${base}pyodide.mjs`);
      const py: PyodideAPI = await mod.loadPyodide({ indexURL: base });
      py.runPython(tracerSource);
      (self as unknown as Worker).postMessage({ id: -1, ready: true } satisfies WorkerResponse);
      return py;
    })();
  }
  return pyodide;
}

load();

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const { id, payload } = e.data;
  try {
    const py = await load();
    const json = py.globals.get("run_json")(JSON.stringify(payload));
    (self as unknown as Worker).postMessage({ id, ok: true, json } satisfies WorkerResponse);
  } catch (err) {
    (self as unknown as Worker).postMessage({ id, ok: false, message: String(err) } satisfies WorkerResponse);
  }
};

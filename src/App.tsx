import { useEffect } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import CodePane from "./components/CodePane";
import Player from "./components/Player";
import { usePlayback } from "./lib/usePlayback";
import { useCurrentStep, useStore } from "./store/useStore";
import twoSum from "./problems/two-sum.json";
import type { Problem } from "./types/problem";

export default function App() {
  usePlayback();
  const status = useStore((s) => s.status);
  const step = useCurrentStep();

  useEffect(() => {
    useStore.getState().loadProblem(twoSum as unknown as Problem);
  }, []);

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-line px-4">
        <div className="size-5 rounded-md bg-gradient-to-br from-accent to-p-violet shadow-[0_0_16px_rgb(124_156_255/0.5)]" />
        <span className="text-sm font-semibold tracking-tight">NeetCode Visualizer</span>
      </header>
      <PanelGroup direction="horizontal" className="min-h-0 flex-1">
        <Panel defaultSize={18} minSize={14} className="bg-panel">
          <div className="p-4 text-sm text-ink-dim">Problems</div>
        </Panel>
        <PanelResizeHandle className="resize-handle" />
        <Panel defaultSize={40} minSize={25} className="bg-[#0d0d10]">
          <CodePane />
        </Panel>
        <PanelResizeHandle className="resize-handle" />
        <Panel defaultSize={42} minSize={30}>
          <div className="flex flex-col gap-4 p-4">
            <Player />
            <div className="card p-4 font-mono text-xs text-ink-dim">
              <div>status: {status}</div>
              <div>line {step?.line} · {step?.event}</div>
              <div className="mt-2 text-sm text-ink">{step?.caption}</div>
            </div>
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
}

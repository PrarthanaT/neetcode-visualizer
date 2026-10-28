import { useEffect } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import Sidebar from "./components/Sidebar";
import ProblemHeader from "./components/ProblemHeader";
import CodePane from "./components/CodePane";
import Visualizer from "./components/Visualizer";
import Caption from "./components/Caption";
import Player from "./components/Player";
import FramesView from "./components/FramesView";
import Tabs from "./components/Tabs";
import { GlossaryContext } from "./components/Prose";
import { usePlayback } from "./lib/usePlayback";
import { useRoute } from "./lib/useRoute";
import { loadProblemFile } from "./lib/problems";
import { useStore } from "./store/useStore";

export default function App() {
  usePlayback();
  const [slug, select] = useRoute();
  const problem = useStore((s) => s.problem);

  useEffect(() => {
    let alive = true;
    loadProblemFile(slug).then((p) => {
      if (alive && p) useStore.getState().loadProblem(p);
    });
    return () => {
      alive = false;
    };
  }, [slug]);

  useEffect(() => {
    if (problem) document.title = `${problem.title} · NeetCode Visualizer`;
  }, [problem]);

  return (
    <GlossaryContext.Provider value={problem?.glossary ?? {}}>
      <div className="flex h-full flex-col">
        <header className="flex h-12 shrink-0 items-center gap-3 border-b border-line px-4">
          <img src="/favicon.svg" alt="" className="size-5 drop-shadow-[0_0_10px_rgb(124_156_255/0.6)]" />
          <span className="text-sm font-semibold tracking-tight">NeetCode Visualizer</span>
          <span className="text-xs text-ink-faint">learn the patterns one line at a time</span>
          <div className="ml-auto flex items-center gap-3 text-[11px] text-ink-faint">
            <Kbd>←</Kbd><Kbd>→</Kbd> step <Kbd>space</Kbd> play
          </div>
        </header>
        <PanelGroup direction="horizontal" autoSaveId="nv-cols" className="min-h-0 flex-1">
          <Panel defaultSize={17} minSize={12} className="bg-panel">
            <Sidebar selected={slug} onSelect={select} />
          </Panel>
          <PanelResizeHandle className="resize-handle" />
          <Panel defaultSize={38} minSize={25} className="flex flex-col bg-[#0d0d10]">
            <ProblemHeader />
            <div className="min-h-0 flex-1">
              <CodePane />
            </div>
          </Panel>
          <PanelResizeHandle className="resize-handle" />
          <Panel defaultSize={45} minSize={30}>
            <PanelGroup direction="vertical" autoSaveId="nv-right">
              <Panel defaultSize={58} minSize={25}>
                <div className="flex h-full flex-col gap-3 overflow-y-auto p-4 [&>*]:shrink-0">
                  <Visualizer />
                  <Caption />
                  <Player />
                  <FramesView />
                </div>
              </Panel>
              <PanelResizeHandle className="resize-handle-h" />
              <Panel defaultSize={42} minSize={15} className="border-t border-line bg-panel">
                {problem && <Tabs key={problem.slug} />}
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>
    </GlossaryContext.Provider>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="rounded border border-line-strong bg-white/5 px-1.5 py-px font-mono text-[10px] text-ink-dim">{children}</kbd>;
}

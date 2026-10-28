import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

export default function App() {
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
        <Panel defaultSize={40} minSize={25}>
          <div className="p-4 text-sm text-ink-dim">Code</div>
        </Panel>
        <PanelResizeHandle className="resize-handle" />
        <Panel defaultSize={42} minSize={30}>
          <div className="p-4 text-sm text-ink-dim">Visualizer</div>
        </Panel>
      </PanelGroup>
    </div>
  );
}

import { useEffect, useRef } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import "../lib/monaco";
import { useCurrentStep, useStore } from "../store/useStore";

type MonacoEditor = Parameters<OnMount>[0];

export default function CodePane() {
  const problem = useStore((s) => s.problem);
  const pinnedLine = useStore((s) => s.pinnedLine);
  const step = useCurrentStep();
  const editorRef = useRef<MonacoEditor | null>(null);
  const decorations = useRef<ReturnType<MonacoEditor["createDecorationsCollection"]> | null>(null);

  const onMount: OnMount = (editor) => {
    editorRef.current = editor;
    decorations.current = editor.createDecorationsCollection();
    editor.onMouseDown((e) => {
      const line = e.target.position?.lineNumber;
      if (!line) return;
      const { pinnedLine, pinLine } = useStore.getState();
      pinLine(pinnedLine === line ? null : line);
    });
    paint();
  };

  function paint() {
    const editor = editorRef.current;
    if (!editor || !decorations.current) return;
    const { pinnedLine } = useStore.getState();
    const s = useStore.getState().trace?.steps[useStore.getState().cursor];
    const decos = [];
    if (s) {
      decos.push({
        range: { startLineNumber: s.line, startColumn: 1, endLineNumber: s.line, endColumn: 1 },
        options: {
          isWholeLine: true,
          className: "current-line-glow",
          glyphMarginClassName: "current-line-arrow",
        },
      });
      editor.revealLineInCenterIfOutsideViewport(s.line, 0);
    }
    if (pinnedLine && pinnedLine !== s?.line) {
      decos.push({
        range: { startLineNumber: pinnedLine, startColumn: 1, endLineNumber: pinnedLine, endColumn: 1 },
        options: { isWholeLine: true, className: "preview-line" },
      });
    }
    decorations.current.set(decos);
  }

  useEffect(paint, [step, pinnedLine]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-10 shrink-0 items-center gap-2 border-b border-line px-4 text-xs text-ink-faint">
        <span className="font-mono text-ink-dim">solution.py</span>
        <span className="ml-auto">Click any line to read about it</span>
      </div>
      <div className="min-h-0 flex-1 pt-3">
        {problem && (
          <Editor
            key={problem.slug}
            language="python"
            theme="nv-dark"
            value={problem.code.replace(/\n+$/, "")}
            onMount={onMount}
            options={{
              readOnly: true,
              domReadOnly: true,
              minimap: { enabled: false },
              fontFamily: "JetBrains Mono",
              fontSize: 14,
              lineHeight: 26,
              glyphMargin: true,
              folding: false,
              renderLineHighlight: "none",
              scrollBeyondLastLine: false,
              overviewRulerLanes: 0,
              hideCursorInOverviewRuler: true,
              occurrencesHighlight: "off",
              selectionHighlight: false,
              contextmenu: false,
              padding: { top: 4 },
              scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
              guides: { indentation: true },
              renderWhitespace: "none",
            }}
          />
        )}
      </div>
    </div>
  );
}

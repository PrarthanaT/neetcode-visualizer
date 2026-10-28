// Bundle Monaco locally (no CDN) with just the Python grammar.
import * as monaco from "monaco-editor/editor/editor.api";
import "monaco-editor/languages/definitions/python/register";
import EditorWorker from "monaco-editor/editor/editor.worker?worker";
import { loader } from "@monaco-editor/react";

self.MonacoEnvironment = { getWorker: () => new EditorWorker() };

monaco.editor.defineTheme("nv-dark", {
  base: "vs-dark",
  inherit: true,
  rules: [
    { token: "keyword", foreground: "c4a7ff" },
    { token: "string", foreground: "9ee6a8" },
    { token: "number", foreground: "f9c97c" },
    { token: "comment", foreground: "5c6370", fontStyle: "italic" },
    { token: "identifier", foreground: "e4e4e7" },
    { token: "delimiter", foreground: "a1a1aa" },
    { token: "type", foreground: "7dd3fc" },
  ],
  colors: {
    "editor.background": "#0d0d10",
    "editor.lineHighlightBackground": "#00000000",
    "editor.lineHighlightBorder": "#00000000",
    "editorLineNumber.foreground": "#3f3f46",
    "editorLineNumber.activeForeground": "#a1a1aa",
    "editorIndentGuide.background1": "#1f1f24",
    "editorCursor.foreground": "#00000000",
    "editor.selectionBackground": "#7c9cff33",
    "scrollbarSlider.background": "#ffffff14",
  },
});

loader.config({ monaco });

import { useEffect, useState } from "react";
import * as monaco from "monaco-editor/editor/editor.api";
import "../lib/monaco";

/** Read-only Python snippet, colored with the same theme as the editor. */
export function Code({ code, block = false, className = "" }: { code: string; block?: boolean; className?: string }) {
  const [html, setHtml] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    monaco.editor.colorize(code, "python", { tabSize: 4 }).then((h) => alive && setHtml(h));
    return () => {
      alive = false;
    };
  }, [code]);

  const cls = `font-mono text-[13px] leading-relaxed ${className}`;
  if (block)
    return (
      <pre className={`overflow-x-auto rounded-xl border border-line bg-[#0d0d10] p-3 ${cls}`}>
        {html ? <code dangerouslySetInnerHTML={{ __html: html }} /> : <code>{code}</code>}
      </pre>
    );
  return html ? <code className={cls} dangerouslySetInnerHTML={{ __html: html }} /> : <code className={cls}>{code}</code>;
}

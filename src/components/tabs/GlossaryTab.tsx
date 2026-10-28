import { useState } from "react";
import { useStore } from "../../store/useStore";
import { SearchIcon } from "../Icons";

export default function GlossaryTab() {
  const { glossary } = useStore((s) => s.problem)!;
  const [q, setQ] = useState("");
  const entries = Object.entries(glossary)
    .filter(([t, d]) => !q || t.toLowerCase().includes(q.toLowerCase()) || d.toLowerCase().includes(q.toLowerCase()))
    .sort(([a], [b]) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 rounded-lg border border-line bg-white/[0.03] px-2.5 py-1.5 text-ink-faint focus-within:border-accent/50">
        <SearchIcon />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${Object.keys(glossary).length} terms`} className="w-full bg-transparent text-xs text-ink outline-none placeholder:text-ink-faint" />
      </label>
      <dl className="divide-y divide-line overflow-hidden rounded-xl border border-line">
        {entries.map(([term, def]) => (
          <div key={term} className="px-3 py-2.5">
            <dt className="text-[13px] font-semibold text-ink">{term}</dt>
            <dd className="mt-0.5 text-[13px] leading-relaxed text-ink-dim">{def}</dd>
          </div>
        ))}
        {!entries.length && <div className="p-4 text-center text-xs text-ink-faint">No terms match</div>}
      </dl>
    </div>
  );
}

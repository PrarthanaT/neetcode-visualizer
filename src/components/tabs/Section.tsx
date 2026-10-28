import { Prose } from "../Prose";

export function Section({ title, tone, children }: { title: string; tone?: "warn" | "good" | "bad"; children: React.ReactNode }) {
  const color = tone === "warn" ? "text-p-rose" : tone === "good" ? "text-p-emerald" : tone === "bad" ? "text-p-amber" : "text-ink-faint";
  return (
    <section className="space-y-2">
      <h3 className={`text-[11px] font-semibold uppercase tracking-wider ${color}`}>{title}</h3>
      {children}
    </section>
  );
}

export function Para({ text }: { text: string }) {
  return (
    <p className="text-[14px] leading-relaxed text-ink-dim">
      <Prose text={text} />
    </p>
  );
}

export function Bullets({ items, marker = "•" }: { items: string[]; marker?: string }) {
  return (
    <ul className="space-y-2">
      {items.map((t, i) => (
        <li key={i} className="flex gap-2.5 text-[14px] leading-relaxed text-ink-dim">
          <span className="mt-[1px] shrink-0 text-accent">{marker}</span>
          <Prose text={t} />
        </li>
      ))}
    </ul>
  );
}

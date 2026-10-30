import indexJson from "../problems/index.json";
import sharedGlossary from "../problems/glossary-shared.json";
import type { Problem, ProblemIndexEntry } from "../types/problem";

const modules = import.meta.glob<{ default: Problem }>([
  "../problems/*.json",
  "!../problems/index.json",
  "!../problems/glossary-shared.json",
]);
const pathFor = (slug: string) => `../problems/${slug}.json`;

export const INDEX = indexJson as ProblemIndexEntry[];
export const AVAILABLE = new Set(Object.keys(modules).map((p) => p.replace(/^.*\/|\.json$/g, "")));

export const CATEGORIES: { name: string; problems: ProblemIndexEntry[] }[] = [];
for (const p of INDEX) {
  let cat = CATEGORIES.find((c) => c.name === p.category);
  if (!cat) CATEGORIES.push((cat = { name: p.category, problems: [] }));
  cat.problems.push(p);
}

export async function loadProblemFile(slug: string): Promise<Problem | null> {
  const load = modules[pathFor(slug)];
  if (!load) return null;
  const problem = (await load()).default;
  return { ...problem, glossary: { ...sharedGlossary, ...problem.glossary } };
}

export const firstAvailable = () => INDEX.find((p) => AVAILABLE.has(p.slug))!.slug;

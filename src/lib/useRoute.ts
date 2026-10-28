import { useEffect, useState } from "react";
import { AVAILABLE, firstAvailable } from "./problems";

const read = () => {
  const slug = window.location.hash.replace(/^#\/?/, "");
  return AVAILABLE.has(slug) ? slug : firstAvailable();
};

/** The selected problem lives in the URL hash (#/two-sum), so reloads and links keep it. */
export function useRoute(): [string, (slug: string) => void] {
  const [slug, setSlug] = useState(read);
  useEffect(() => {
    const on = () => setSlug(read());
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return [slug, (s) => (window.location.hash = `/${s}`)];
}

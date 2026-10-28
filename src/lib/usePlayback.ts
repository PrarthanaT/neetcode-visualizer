import { useEffect } from "react";
import { useStore } from "../store/useStore";

/** Advances the cursor while playing, and wires the keyboard: arrows step, space plays. */
export function usePlayback() {
  const playing = useStore((s) => s.playing);
  const speed = useStore((s) => s.speed);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => useStore.getState().next(), 1000 / speed);
    return () => window.clearInterval(id);
  }, [playing, speed]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) {
        // let the slider/scrubber keep their own arrow keys; the search box keeps everything
        if (!(t instanceof HTMLInputElement && t.type === "range" && e.key === " ")) return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const s = useStore.getState();
      if (e.key === "ArrowRight") {
        e.preventDefault();
        s.next();
        useStore.setState({ playing: false });
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        s.back();
      } else if (e.key === " ") {
        e.preventDefault();
        s.togglePlay();
      }
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true });
  }, []);
}

import { useStore } from "../store/useStore";
import { BackIcon, NextIcon, PauseIcon, PlayIcon, RestartIcon } from "./Icons";

const SPEEDS = [0.5, 1, 2, 3, 5, 8];

export default function Player() {
  const { trace, cursor, playing, speed, seek, next, back, togglePlay, setSpeed } = useStore();
  const total = trace?.steps.length ?? 0;
  const disabled = !trace || total === 0;
  const atEnd = cursor >= total - 1;
  const pct = total > 1 ? (cursor / (total - 1)) * 100 : 0;

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1 rounded-xl border border-line bg-panel p-1">
        <IconButton label="Start over" onClick={() => seek(0)} disabled={disabled || cursor === 0}>
          <RestartIcon />
        </IconButton>
        <IconButton label="Back (←)" onClick={back} disabled={disabled || cursor === 0}>
          <BackIcon />
        </IconButton>
        <button
          onClick={togglePlay}
          disabled={disabled}
          aria-label={playing ? "Pause (space)" : "Play (space)"}
          title={playing ? "Pause (space)" : "Play (space)"}
          className="grid size-8 place-items-center rounded-lg bg-accent text-bg shadow-[0_0_18px_rgb(124_156_255/0.45)] transition hover:brightness-110 disabled:opacity-40"
        >
          {playing ? <PauseIcon /> : atEnd && total > 1 ? <RestartIcon /> : <PlayIcon />}
        </button>
        <IconButton label="Next (→)" onClick={() => { next(); useStore.setState({ playing: false }); }} disabled={disabled || atEnd}>
          <NextIcon />
        </IconButton>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <input
          type="range"
          aria-label="Step scrubber"
          min={0}
          max={Math.max(0, total - 1)}
          value={cursor}
          disabled={disabled}
          onChange={(e) => seek(Number(e.target.value))}
          className="scrubber w-full"
          style={{ ["--pct" as string]: `${pct}%` }}
        />
        <div className="flex justify-between font-mono text-[11px] text-ink-faint">
          <span>
            step <span className="text-ink-dim">{total ? cursor + 1 : 0}</span> / {total}
            {trace?.truncated && <span className="ml-2 text-p-amber">stopped at 500 steps</span>}
          </span>
          <label className="flex items-center gap-2">
            speed
            <input
              type="range"
              aria-label="Playback speed"
              min={0}
              max={SPEEDS.length - 1}
              value={Math.max(0, SPEEDS.indexOf(speed))}
              onChange={(e) => setSpeed(SPEEDS[Number(e.target.value)])}
              className="scrubber w-20"
              style={{ ["--pct" as string]: `${(SPEEDS.indexOf(speed) / (SPEEDS.length - 1)) * 100}%` }}
            />
            <span className="w-8 text-ink-dim">{speed}×</span>
          </label>
        </div>
      </div>
    </div>
  );
}

function IconButton(props: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={props.onClick}
      disabled={props.disabled}
      aria-label={props.label}
      title={props.label}
      className="grid size-8 place-items-center rounded-lg text-ink-dim transition hover:bg-white/5 hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent"
    >
      {props.children}
    </button>
  );
}

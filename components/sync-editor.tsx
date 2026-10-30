"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  buildLrcFromLines,
  csToLrcTimestamp,
  isLrcTimestamped,
  parseLrcLine,
  type TimedLine,
} from "@/lib/lrc";
import {
  CheckIcon,
  CloudIcon,
  LoaderIcon,
  PauseIcon,
  PlayIcon,
  XIcon,
} from "@/components/icons";
import { cn } from "@/lib/utils";

// SoundCloud Widget API (https://developers.soundcloud.com/docs/api/html5-widget.html).
// Positions and durations come back in milliseconds; LRC wants centiseconds.
type ScEvent = { currentPosition?: number };

interface ScWidget {
  play(): void;
  pause(): void;
  toggle(): void;
  seekTo(ms: number): void;
  getDuration(cb: (ms: number) => void): void;
  getPosition(cb: (ms: number) => void): void;
  isPaused(cb: (paused: boolean) => void): void;
  bind(event: string, listener: (e?: ScEvent) => void): void;
}

interface ScGlobal {
  Widget: {
    (el: HTMLIFrameElement): ScWidget;
    Events: Record<string, string>;
  };
}

declare global {
  interface Window {
    SC?: ScGlobal;
  }
}

let scScript: Promise<void> | null = null;

function loadSoundCloudScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.SC?.Widget) return Promise.resolve();
  if (!scScript) {
    scScript = new Promise<void>((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://w.soundcloud.com/player/api.js";
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("SoundCloud player script blocked"));
      document.head.appendChild(s);
    }).catch((e) => {
      scScript = null;
      throw e;
    });
  }
  return scScript;
}

const SAMPLE_TRACK = "https://soundcloud.com/forss/flickermood";

const LineRow = memo(function LineRow({
  line,
  index,
  isActive,
  isCurrent,
  onSelect,
  rowRef,
}: {
  line: TimedLine;
  index: number;
  isActive: boolean;
  isCurrent: boolean;
  onSelect: (i: number) => void;
  rowRef: (el: HTMLButtonElement | null) => void;
}) {
  return (
    <li>
      <button
        type="button"
        ref={isActive ? rowRef : undefined}
        onClick={() => onSelect(index)}
        className={cn(
          "flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left transition-colors duration-150",
          isActive ? "bg-raised ring-1 ring-mint/50" : "hover:bg-raised/60",
        )}
      >
        <span
          className={cn(
            "w-[68px] shrink-0 font-mono text-xs tabular-nums",
            line.cs != null ? "text-mint" : "text-fog/45",
          )}
        >
          {line.cs != null ? csToLrcTimestamp(line.cs) : "--:--.--"}
        </span>
        <span
          className={cn(
            "min-w-0 flex-1 truncate text-sm",
            isCurrent
              ? "text-paper"
              : line.cs != null
                ? "text-paper/80"
                : "text-fog",
          )}
        >
          {line.text || "\u00a0"}
        </span>
        {line.cs != null && (
          <CheckIcon className="size-3.5 shrink-0 text-mint" />
        )}
      </button>
    </li>
  );
});

export function SyncEditor({
  initialLyrics,
  onApply,
  onClose,
}: {
  initialLyrics: string;
  onApply: (synced: string) => void;
  onClose: () => void;
}) {
  const [lines, setLines] = useState<TimedLine[]>(() =>
    initialLyrics.split(/\r?\n/).map(parseLrcLine),
  );
  const [url, setUrl] = useState("");
  const [track, setTrack] = useState<{ src: string; title: string } | null>(
    null,
  );
  const [loadingTrack, setLoadingTrack] = useState(false);
  const [trackErr, setTrackErr] = useState("");
  const [widgetErr, setWidgetErr] = useState("");
  const [playing, setPlaying] = useState(false);
  const [hasWidget, setHasWidget] = useState(false);
  const [posCs, setPosCs] = useState(0);
  const [durCs, setDurCs] = useState(0);
  const [scrubCs, setScrubCs] = useState<number | null>(null);
  const [active, setActive] = useState(0);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const widgetRef = useRef<ScWidget | null>(null);
  // Last known playback position (ms) and the clock reading it was taken at.
  const anchor = useRef({ ms: 0, at: 0 });
  const stampRef = useRef<() => void>(() => {});
  const linesRef = useRef<TimedLine[]>(lines);
  const activeRowRef = useRef<HTMLButtonElement | null>(null);

  // --- SoundCloud player -------------------------------------------------

  async function loadTrack(nextUrl?: string) {
    const target = (nextUrl ?? url).trim();
    if (!target) return;
    setLoadingTrack(true);
    setTrackErr("");
    setWidgetErr("");
    let data: { html?: string; title?: string } | null = null;
    try {
      const r = await fetch(
        `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(target)}`,
      );
      if (r.ok) {
        data = (await r.json()) as { html?: string; title?: string };
      }
    } catch {
      data = null;
    }
    setLoadingTrack(false);
    const src = data?.html
      ?.match(/src="([^"]+)"/)?.[1]
      ?.replace(/&amp;/g, "&");
    if (!src) {
      setTrack(null);
      setTrackErr(
        "Couldn't load that URL — paste a link to a SoundCloud track.",
      );
      return;
    }
    widgetRef.current = null;
    setHasWidget(false);
    setPlaying(false);
    setPosCs(0);
    setDurCs(0);
    setTrack({ src, title: data?.title ?? target });
  }

  function handleFrameLoad() {
    void loadSoundCloudScript()
      .then(() => {
        const el = iframeRef.current;
        const SC = window.SC;
        if (!el || !SC?.Widget) return;
        const w = SC.Widget(el);
        widgetRef.current = w;
        setHasWidget(true);
        const E = SC.Widget.Events;
        const readPosition = () =>
          w.getPosition((ms) => {
            anchor.current = { ms, at: performance.now() };
            setPosCs(ms / 10);
          });
        const readDuration = () => w.getDuration((ms) => setDurCs(ms / 10));

        w.bind(E.READY, () => {
          readDuration();
          readPosition();
          w.isPaused((p) => setPlaying(!p));
        });
        w.bind(E.PLAY, () => {
          readDuration();
          anchor.current = { ...anchor.current, at: performance.now() };
          setPlaying(true);
        });
        w.bind(E.PAUSE, () => {
          readPosition();
          setPlaying(false);
        });
        w.bind(E.FINISH, () => {
          readPosition();
          setPlaying(false);
        });
        w.bind(E.SEEK, (e) => {
          if (typeof e?.currentPosition === "number") {
            anchor.current = {
              ms: e.currentPosition,
              at: performance.now(),
            };
            setPosCs(e.currentPosition / 10);
          } else {
            readPosition();
          }
        });
        w.bind(E.PLAY_PROGRESS, (e) => {
          if (typeof e?.currentPosition === "number") {
            anchor.current = {
              ms: e.currentPosition,
              at: performance.now(),
            };
          }
        });
        w.bind(E.ERROR, () =>
          setWidgetErr("This track can't be played in the widget."),
        );
      })
      .catch(() =>
        setWidgetErr("The SoundCloud player failed to load (blocked?)."),
      );
  }

  // Smooth clock while playing, interpolated between widget events.
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const tick = () => {
      const { ms, at } = anchor.current;
      setPosCs((ms + (performance.now() - at)) / 10);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  // Safety net: keep the anchor and duration fresh even if events are sparse.
  useEffect(() => {
    if (!track) return;
    const id = window.setInterval(() => {
      const w = widgetRef.current;
      if (!w) return;
      w.getPosition((ms) => {
        anchor.current = { ms, at: performance.now() };
      });
      w.getDuration((ms) => setDurCs((d) => (Math.abs(d - ms / 10) > 1 ? ms / 10 : d)));
    }, 500);
    return () => window.clearInterval(id);
  }, [track]);

  // --- Editing -----------------------------------------------------------

  function positionCs(): number {
    const { ms, at } = anchor.current;
    return (playing ? ms + (performance.now() - at) : ms) / 10;
  }

  function stamp() {
    const idx = Math.min(active, lines.length - 1);
    if (idx < 0) return;
    const cs = Math.round(positionCs());
    const after = lines.findIndex((l, i) => i > idx && l.cs == null);
    const anywhere = lines.findIndex((l) => l.cs == null);
    const target =
      after !== -1
        ? after
        : anywhere !== -1
          ? anywhere
          : Math.min(idx + 1, lines.length - 1);
    setLines((prev) =>
      prev.map((l, i) => (i === idx ? { ...l, cs: Math.max(0, cs) } : l)),
    );
    setActive(target);
  }

  function nudge(deltaCs: number) {
    setLines((prev) =>
      prev.map((l, i) =>
        i === active && l.cs != null
          ? { ...l, cs: Math.max(0, l.cs + deltaCs) }
          : l,
      ),
    );
  }

  function clearStamp() {
    setLines((prev) =>
      prev.map((l, i) => (i === active ? { ...l, cs: null } : l)),
    );
  }

  function seekToCs(cs: number) {
    const w = widgetRef.current;
    const ms = Math.max(0, Math.round(cs * 10));
    anchor.current = { ms, at: performance.now() };
    setPosCs(ms / 10);
    w?.seekTo(ms);
  }

  useEffect(() => {
    linesRef.current = lines;
  });
  useEffect(() => {
    stampRef.current = stamp;
  });
  useEffect(() => {
    activeRowRef.current?.scrollIntoView({ block: "nearest" });
  }, [active]);

  // Space stamps, arrows move the selection — unless a control has focus.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      const tag = t?.tagName;
      const inControl =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        tag === "BUTTON" ||
        t?.isContentEditable;
      if (e.code === "Space") {
        if (inControl || e.repeat) return;
        e.preventDefault();
        stampRef.current();
        return;
      }
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      if (inControl) return;
      e.preventDefault();
      const last = Math.max(0, linesRef.current.length - 1);
      setActive((a) => (e.key === "ArrowDown" ? Math.min(a + 1, last) : Math.max(a - 1, 0)));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const lrc = useMemo(() => buildLrcFromLines(lines), [lines]);
  const stamped = lines.filter((l) => l.cs != null).length;
  const ready = isLrcTimestamped(lrc);
  const selected = lines[Math.min(active, lines.length - 1)] ?? null;
  const currentLine = useMemo(() => {
    let idx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].cs != null && (lines[i].cs as number) <= posCs) idx = i;
    }
    return idx;
  }, [lines, posCs]);
  const shownCs = scrubCs ?? Math.min(posCs, Math.max(0, durCs));

  return (
    <Card className="flex flex-col gap-4 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg font-bold tracking-tight">
            Time it with the music
          </h3>
          <p className="text-sm text-fog">
            Load a SoundCloud track, play it, and stamp each line as it lands.
            Space stamps the selected line, ↑/↓ move through the lyrics.
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close sync editor">
          <XIcon />
        </Button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void loadTrack();
            }
          }}
          placeholder="https://soundcloud.com/artist/track"
          aria-label="SoundCloud track URL"
          className="flex-1 font-mono text-sm"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => void loadTrack()}
          disabled={loadingTrack || !url.trim()}
        >
          {loadingTrack ? <LoaderIcon /> : <CloudIcon />}
          Load track
        </Button>
      </div>
      <p className="-mt-1 text-xs text-fog">
        No link handy?{" "}
        <button
          type="button"
          className="cursor-pointer text-mint underline underline-offset-2 hover:text-paper"
          onClick={() => {
            setUrl(SAMPLE_TRACK);
            void loadTrack(SAMPLE_TRACK);
          }}
        >
          load the sample track
        </button>{" "}
        to try the editor.
      </p>
      {trackErr && <p className="text-sm text-danger">{trackErr}</p>}

      {track && (
        <div className="flex flex-col gap-3 rounded-xl border border-edge bg-abyss p-3">
          <iframe
            key={track.src}
            ref={iframeRef}
            src={track.src}
            title="SoundCloud player"
            onLoad={handleFrameLoad}
            allow="autoplay; encrypted-media"
            className="h-[166px] w-full rounded-lg"
          />
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs tabular-nums text-mint">
              {csToLrcTimestamp(Math.round(shownCs))}
            </span>
            <input
              type="range"
              min={0}
              max={Math.max(1, durCs)}
              step={1}
              value={Math.round(shownCs)}
              disabled={durCs <= 0}
              aria-label="Playback position"
              onChange={(e) => setScrubCs(Number(e.target.value))}
              onPointerUp={() => {
                if (scrubCs != null) seekToCs(scrubCs);
                setScrubCs(null);
              }}
              onKeyUp={() => {
                if (scrubCs != null) seekToCs(scrubCs);
                setScrubCs(null);
              }}
              className="min-w-0 flex-1 cursor-pointer accent-mint"
            />
            <span className="font-mono text-xs tabular-nums text-fog">
              {csToLrcTimestamp(Math.round(Math.max(0, durCs)))}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => seekToCs(Math.max(0, posCs - 500))}
              disabled={durCs <= 0}
            >
              −5s
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => widgetRef.current?.toggle()}
              disabled={!hasWidget}
            >
              {playing ? <PauseIcon /> : <PlayIcon />}
              {playing ? "Pause" : "Play"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => seekToCs(Math.min(durCs, posCs + 500))}
              disabled={durCs <= 0}
            >
              +5s
            </Button>
            <span className="flex-1" />
            <span className="truncate font-mono text-xs text-fog">
              {track.title}
            </span>
          </div>
          {widgetErr && <p className="text-sm text-danger">{widgetErr}</p>}
        </div>
      )}

      <div className="flex items-center gap-2">
        <span className="font-mono text-xs uppercase tracking-widest text-fog">
          Lines
        </span>
        <span className="font-mono text-xs text-mint">
          {stamped}/{lines.length} timed
        </span>
      </div>

      <ol className="slim-scroll flex max-h-72 flex-col gap-1 overflow-auto rounded-lg border border-edge bg-abyss p-2">
        {lines.map((l, i) => (
          <LineRow
            key={i}
            line={l}
            index={i}
            isActive={i === active}
            isCurrent={i === currentLine}
            onSelect={setActive}
            rowRef={(el) => {
              activeRowRef.current = el;
            }}
          />
        ))}
      </ol>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          onClick={(e) => {
            e.currentTarget.blur();
            stamp();
          }}
          disabled={lines.length === 0}
        >
          Stamp line
          <kbd className="rounded border border-abyss/30 bg-abyss/20 px-1.5 py-0.5 font-mono text-[10px]">
            space
          </kbd>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => nudge(-10)}
          disabled={selected?.cs == null}
        >
          −0.1s
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => nudge(10)}
          disabled={selected?.cs == null}
        >
          +0.1s
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clearStamp}
          disabled={selected?.cs == null}
        >
          Clear
        </Button>
        <span className="flex-1" />
        <span className="text-xs text-fog">
          {selected?.cs != null
            ? `Selected line at ${csToLrcTimestamp(selected.cs)}`
            : "Selected line has no timestamp yet"}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-fog">LRC output</p>
        <textarea
          readOnly
          value={lrc}
          rows={Math.min(8, Math.max(3, lines.length))}
          aria-label="Generated LRC"
          className="slim-scroll w-full resize-y rounded-lg border border-edge bg-abyss p-3.5 font-mono text-[13px] leading-relaxed whitespace-pre-wrap text-paper/85 focus:border-mint focus:outline-none"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={() => onApply(lrc)} disabled={!ready}>
          Use these timings
        </Button>
        <p className="text-sm text-fog">
          {ready
            ? "Fills the synced-lyrics field in the form."
            : "Stamp most lines first — the API needs timestamps on more than half of them."}
        </p>
      </div>
    </Card>
  );
}

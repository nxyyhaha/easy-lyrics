"use client";

import { useState } from "react";
import { Page } from "@/components/chrome";
import { Badge, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import {
  CheckIcon,
  CopyIcon,
  LoaderIcon,
  SearchIcon,
  TerminalIcon,
  TimerIcon,
  XIcon,
} from "@/components/icons";
import { cn } from "@/lib/utils";

const ALL_SOURCES = [
  "own",
  "lrclib",
  "megalobiz",
  "netease",
  "tencent",
  "lrc.cx",
  "musixmatch",
  "lyrics.ovh",
];

interface Attempt {
  source: string;
  ok: boolean;
  latencyMs: number;
  error?: string;
}

interface LookupResult {
  title: string;
  artist: string;
  plainLyrics: string | null;
  syncedLyrics: string | null;
  instrumental: boolean;
  source: string;
  sourceUrl?: string;
  artUrl?: string;
  durationSec?: number;
  sourcesTried: Attempt[];
}

type Tab = "lyrics" | "synced" | "raw";

function parseLrc(synced: string): { t: string; line: string }[] {
  return synced.split("\n").map((row) => {
    const m = row.match(/^\s*\[(.+?)\]\s?(.*)$/);
    return m ? { t: m[1], line: m[2] } : { t: "", line: row };
  });
}

export default function Home() {
  const [title, setTitle] = useState("Beautiful");
  const [artist, setArtist] = useState("Eminem");
  const [duration, setDuration] = useState("");
  const [sources, setSources] = useState<string[]>([...ALL_SOURCES]);
  const [syncedOnly, setSyncedOnly] = useState(false);
  const [tab, setTab] = useState<Tab>("lyrics");
  const [data, setData] = useState<LookupResult | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  function toggle(s: string) {
    setSources((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  }

  async function lookup(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    setErr("");
    setCopied(false);
    try {
      const p = new URLSearchParams({
        title,
        artist,
        sources: sources.join(","),
        debug: "true",
      });
      if (duration) p.set("duration", duration);
      if (syncedOnly) p.set("syncedOnly", "true");
      const r = await fetch(`/api/lyrics?${p}`);
      const j = await r.json();
      if (!r.ok) {
        setData(null);
        setErr(j.error ?? "Lookup failed");
        return;
      }
      setData(j as LookupResult);
      setTab(j.syncedLyrics ? "synced" : "lyrics");
    } catch (e) {
      setData(null);
      setErr(String(e));
    } finally {
      setLoading(false);
    }
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  const maxLatency = Math.max(
    1,
    ...(data?.sourcesTried.map((a) => a.latencyMs) ?? [1]),
  );
  const tabText =
    tab === "raw"
      ? JSON.stringify(data, null, 2)
      : tab === "synced"
        ? (data?.syncedLyrics ?? "")
        : (data?.plainLyrics ?? "");

  return (
    <Page>
      <section className="flex flex-col gap-2 pt-4 sm:pt-8">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Find the lyrics.
        </h1>
        <p className="max-w-xl text-fog">
          One query checks every source and returns plain lyrics plus synced
          LRC with the source named.
        </p>
      </section>

      <Card className="p-4 sm:p-5">
        <form onSubmit={lookup} className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_140px]">
            <Field label="Title">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Beautiful"
              />
            </Field>
            <Field label="Artist">
              <Input
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="Eminem"
              />
            </Field>
            <Field label="Seconds">
              <Input
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="404"
                inputMode="numeric"
                className="font-mono"
              />
            </Field>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {ALL_SOURCES.map((s) => {
              const on = sources.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggle(s)}
                  aria-pressed={on}
                  className={cn(
                    "cursor-pointer rounded-full border px-3 py-1 font-mono text-xs transition-colors duration-200",
                    on
                      ? "border-mint/60 bg-mint/10 text-mint"
                      : "border-edge text-fog hover:text-paper",
                  )}
                >
                  {s}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => setSyncedOnly((v) => !v)}
              aria-pressed={syncedOnly}
              className="flex cursor-pointer items-center gap-2 text-sm text-fog transition-colors hover:text-paper"
            >
              <span
                className={cn(
                  "relative h-5 w-9 rounded-full transition-colors duration-200",
                  syncedOnly ? "bg-mint" : "bg-edge",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 size-4 rounded-full bg-white transition-all duration-200",
                    syncedOnly ? "left-[18px]" : "left-0.5",
                  )}
                />
              </span>
              Synced only
            </button>
            <span className="flex-1" />
            <Button type="submit" disabled={loading || !title || !artist}>
              {loading ? <LoaderIcon /> : <SearchIcon />}
              {loading ? "Searching…" : "Lookup"}
            </Button>
          </div>
        </form>
      </Card>

      {err && !loading && (
        <Card className="flex items-center gap-3 border-danger/40 bg-danger/10 px-4 py-3">
          <XIcon className="size-4 shrink-0 text-danger" />
          <p className="text-sm">
            <b>{err}.</b>{" "}
            <span className="text-fog">
              Check the spelling, add a duration, or try fewer sources.
            </span>
          </p>
        </Card>
      )}

      {data && (
        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {data.artUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.artUrl}
                alt=""
                className="size-12 rounded-lg border border-edge object-cover"
              />
            )}
            <div className="min-w-0 flex-1">
              <h2 className="font-display truncate text-xl font-bold tracking-tight">
                {data.title}
              </h2>
              <p className="truncate text-sm text-fog">{data.artist}</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="accent">{data.source}</Badge>
              {data.syncedLyrics && <Badge variant="plain">synced LRC</Badge>}
              {data.instrumental && <Badge>instrumental</Badge>}
              {data.durationSec != null && (
                <Badge>
                  <TimerIcon className="size-3" />
                  {Math.floor(data.durationSec / 60)}:
                  {String(Math.round(data.durationSec % 60)).padStart(2, "0")}
                </Badge>
              )}
            </div>
          </div>

          <Card className="overflow-hidden">
            <div className="flex items-center gap-1 border-b border-edge px-2 py-1.5">
              {(
                [
                  { id: "lyrics", label: "Lyrics", show: !!data.plainLyrics },
                  { id: "synced", label: "Synced", show: !!data.syncedLyrics },
                  { id: "raw", label: "Raw", show: true },
                ] as { id: Tab; label: string; show: boolean }[]
              )
                .filter((t) => t.show)
                .map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={cn(
                      "cursor-pointer rounded-md px-3 py-1 text-sm transition-colors duration-200",
                      tab === t.id
                        ? "bg-raised font-medium text-paper"
                        : "text-fog hover:text-paper",
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              <span className="flex-1" />
              <Button variant="ghost" size="sm" onClick={() => copy(tabText)}>
                {copied ? (
                  <CheckIcon className="text-mint" />
                ) : (
                  <CopyIcon />
                )}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>

            <div className="slim-scroll max-h-[440px] overflow-auto p-4 sm:p-5">
              {tab === "synced" && data.syncedLyrics ? (
                <ol className="flex flex-col">
                  {parseLrc(data.syncedLyrics).map((l, i) => (
                    <li
                      key={i}
                      className="flex gap-3 rounded px-2 py-0.5 text-[15px] leading-relaxed transition-colors hover:bg-raised"
                    >
                      <span className="w-[72px] shrink-0 select-none font-mono text-xs leading-6 text-mint/70">
                        {l.t}
                      </span>
                      <span className={l.line ? "" : "h-5"}>{l.line}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <pre className="font-mono text-[13px] leading-relaxed whitespace-pre-wrap text-paper/90">
                  {tabText || "Nothing on this tab."}
                </pre>
              )}
            </div>
          </Card>

          <details className="group rounded-xl border border-edge bg-panel" open>
            <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm text-fog transition-colors hover:text-paper [&::-webkit-details-marker]:hidden">
              <TerminalIcon className="size-4" />
              Sources
              <span className="font-mono text-xs">
                {data.sourcesTried.filter((a) => a.ok).length}/
                {data.sourcesTried.length}
              </span>
            </summary>
            <ul className="flex flex-col gap-1.5 border-t border-edge px-4 py-3">
              {data.sourcesTried.map((a) => (
                <li key={a.source} className="flex items-center gap-2.5 text-sm">
                  {a.ok ? (
                    <CheckIcon className="size-3.5 shrink-0 text-mint" />
                  ) : (
                    <XIcon className="size-3.5 shrink-0 text-fog/50" />
                  )}
                  <span className="w-24 shrink-0 font-mono text-xs text-fog">
                    {a.source}
                  </span>
                  <span className="h-1 flex-1 overflow-hidden rounded-full bg-raised">
                    <span
                      className={cn(
                        "block h-full rounded-full",
                        a.ok ? "bg-mint" : "bg-edge",
                      )}
                      style={{
                        width: `${Math.max(4, (a.latencyMs / maxLatency) * 100)}%`,
                      }}
                    />
                  </span>
                  <span className="w-16 shrink-0 text-right font-mono text-xs text-fog">
                    {a.latencyMs}ms
                  </span>
                </li>
              ))}
            </ul>
          </details>
        </section>
      )}
    </Page>
  );
}

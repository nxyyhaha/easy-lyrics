import Link from "next/link";
import { Page } from "@/components/chrome";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

const ENDPOINTS = [
  {
    method: "GET",
    path: "/api/:title/:artist",
    body: "Lyrist-compatible. Returns { lyrics, title, artist, image, source }. Drop-in replacement.",
  },
  {
    method: "GET",
    path: "/api/lyrics?title=&artist=&album=&duration=&sources=&syncedOnly=",
    body: "Full lookup. sources takes own, lrclib, megalobiz, netease, tencent, lrc.cx, musixmatch, lyrics.ovh. Pass duration in seconds for exact synced matches. Add debug=true to see every source attempt with latency.",
  },
  {
    method: "GET",
    path: "/api/search?q=",
    body: "Track suggestions across sources. Returns up to ten matches.",
  },
  {
    method: "POST",
    path: "/api/submit  { title, artist, plainLyrics?, syncedLyrics? }",
    body: "Send a correction or a missing song. Requires a User-Agent header like nxyy (https://nxyy.codes). syncedLyrics must hold [mm:ss.xx] lines. An admin approves it before it goes live.",
  },
];

const SOURCES = [
  {
    name: "LRCLIB",
    url: "https://lrclib.net",
    body: "Free synced + plain lyrics, no key. Primary upstream source and seed for the community database.",
  },
  {
    name: "Megalobiz",
    url: "https://www.megalobiz.com",
    body: "Community LRC archive. Queried live for synced lyrics.",
  },
  {
    name: "NetEase Cloud Music",
    url: "https://music.163.com",
    body: "Search + lyric endpoints. Queried live for synced lyrics.",
  },
  {
    name: "Tencent QQ Music",
    url: "https://y.qq.com",
    body: "Search + lyric endpoints. Queried live for synced lyrics.",
  },
  {
    name: "lrc.cx",
    url: "https://lrc.cx",
    body: "Legacy LRC search API. Queried live for synced lyrics.",
  },
  {
    name: "Musixmatch",
    url: "https://www.musixmatch.com",
    body: "Licensed API. Only used with your own token. Their terms apply.",
  },
  {
    name: "lyrics.ovh",
    url: "https://lyrics.ovh",
    body: "Free plain-lyrics API. Last-resort fallback.",
  },
  {
    name: "syncedlyrics",
    url: "https://github.com/moehmeni/syncedlyrics",
    body: "MIT library. NetEase / Tencent search + LRC logic ported to TypeScript.",
  },
  {
    name: "Lyrist",
    url: "https://github.com/asrvd/lyrist",
    body: "MIT project. API-shape inspiration for the compatible endpoint.",
  },
];

export default function Guide() {
  return (
    <Page>
      <section className="flex flex-col gap-2 pt-4 sm:pt-8">
        <p className="font-mono text-xs uppercase tracking-widest text-mint">
          Docs
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Call it like this.
        </h1>
        <p className="max-w-xl text-fog">
          Four endpoints. No keys, no signup. Responses carry source and
          sourceUrl so credit lands where it belongs.
        </p>
      </section>

      <div className="flex flex-col gap-3">
        {ENDPOINTS.map((e) => (
          <Card key={e.path} className="p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-2.5">
              <span
                className={cn(
                  "rounded px-1.5 py-0.5 font-mono text-xs font-bold",
                  e.method === "POST"
                    ? "bg-mint/15 text-mint"
                    : "bg-raised text-paper",
                )}
              >
                {e.method}
              </span>
              <code className="min-w-0 flex-1 break-all font-mono text-[13px] text-paper">
                {e.path}
              </code>
            </div>
            <p className="mt-2.5 text-sm leading-relaxed text-fog">{e.body}</p>
          </Card>
        ))}
      </div>

      <section id="sources" className="flex scroll-mt-6 flex-col gap-3">
        <h2 className="font-display text-xl font-bold tracking-tight">
          Sources
        </h2>
        <p className="max-w-xl text-sm text-fog">
          Lyrics belong to their publishers and songwriters. Every response
          carries source and sourceUrl so credit travels with the data.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {SOURCES.map((s) => (
            <Card key={s.name} className="p-4">
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[13px] font-bold text-mint hover:underline"
              >
                {s.name}
              </a>
              <p className="mt-1.5 text-sm leading-relaxed text-fog">
                {s.body}
              </p>
            </Card>
          ))}
        </div>
      </section>

      <div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/">
            <ArrowIcon className="rotate-180" />
            Playground
          </Link>
        </Button>
      </div>
    </Page>
  );
}

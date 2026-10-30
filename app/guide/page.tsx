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
    path: "/api/lyrics?title=&artist=&syncedOnly=",
    body: "Lookup against the catalogue. Returns plain lyrics plus synced LRC when we hold them. syncedOnly=1 answers 404 unless a timestamped version exists.",
  },
  {
    method: "GET",
    path: "/api/search?q=",
    body: "Search the catalogue itself. Returns up to ten tracks we actually hold lyrics for.",
  },
  {
    method: "POST",
    path: "/api/submit  { title, artist, plainLyrics?, syncedLyrics?, type?, reason? }",
    body: "Contribute a new song, a correction or a sync fix. Requires a session cookie from /api/auth (create an account on /contribute). syncedLyrics must hold [mm:ss.xx] lines. An admin approves it before it goes live.",
  },
  {
    method: "GET",
    path: "/api/submit",
    body: "Your last twenty submissions and their review status. Same session cookie as POST.",
  },
];

const SOURCES = [
  {
    name: "The catalogue",
    url: "https://github.com/nxyyhaha/easy-lyrics",
    body: "One database. Every lookup and search reads only from it — nothing is fetched from another lyrics API at request time.",
  },
  {
    name: "Contributors",
    url: "/contribute",
    body: "Signed-in accounts add songs and corrections through POST /api/submit. The session identifies who sent it, and a SoundCloud-powered editor stamps LRC timestamps while the track plays.",
  },
  {
    name: "Review queue",
    url: "/admin",
    body: "An admin approves or rejects each submission. Approved versions become the live catalogue, attributed to the contributor.",
  },
  {
    name: "syncedlyrics",
    url: "https://github.com/moehmeni/syncedlyrics",
    body: "MIT library. Its LRC parsing and normalization logic is ported into lib/lrc.ts.",
  },
  {
    name: "Lyrist",
    url: "https://github.com/asrvd/lyrist",
    body: "MIT project. API-shape inspiration for the compatible endpoint.",
  },
  {
    name: "LRCLIB",
    url: "https://lrclib.net",
    body: "Open lyrics database with published dumps — a convenient seed for a fresh catalogue when you bootstrap your own instance.",
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
          Reads are open — no keys, no signup. Contributing needs an account.
          Responses carry source and sourceUrl so credit lands where it
          belongs.
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
          Where lyrics come from
        </h2>
        <p className="max-w-xl text-sm text-fog">
          They come from us: a single catalogue that the API serves and the
          community writes to. Nothing polls upstream at request time, and
          every response still carries source and sourceUrl so credit travels
          with the data.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {SOURCES.map((s) => (
            <Card key={s.name} className="p-4">
              {s.url.startsWith("/") ? (
                <Link
                  href={s.url}
                  className="font-mono text-[13px] font-bold text-mint hover:underline"
                >
                  {s.name}
                </Link>
              ) : (
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[13px] font-bold text-mint hover:underline"
                >
                  {s.name}
                </a>
              )}
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

import { NextResponse } from "next/server";
import { z } from "zod";
import { fetchWithTimeout } from "@/lib/providers/types";
import { checkRateLimit } from "@/lib/ratelimit";

const Query = z.object({ q: z.string().min(1).max(200) });

export async function GET(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = await checkRateLimit(`search:${ip}`);
  if (!rl.success) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }
  const url = new URL(req.url);
  const parsed = Query.safeParse({ q: url.searchParams.get("q") });
  if (!parsed.success) {
    return NextResponse.json({ error: "Missing q" }, { status: 400 });
  }
  const q = parsed.data.q;
  // Fan out to LRCLIB search + lyrics.ovh suggest; return merged suggestions.
  const [lrclib, suggest] = await Promise.all([
    fetchWithTimeout(
      `https://lrclib.net/api/search?q=${encodeURIComponent(q)}`,
      5000,
    )
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => []),
    fetchWithTimeout(
      `https://api.lyrics.ovh/suggest/${encodeURIComponent(q)}`,
      5000,
    )
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .catch(() => ({ data: [] })),
  ]);
  const out = [
    ...((Array.isArray(lrclib) ? lrclib : []) as Array<Record<string, unknown>>)
      .slice(0, 10)
      .map((s) => ({
        title: s.trackName,
        artist: s.artistName,
        album: s.albumName,
        durationSec: s.duration,
        source: "lrclib",
      })),
    ...(((suggest as { data?: unknown[] }).data ?? []) as Array<
      Record<string, unknown>
    >)
      .slice(0, 10)
      .map((s) => ({
        title: (s.title as string) ?? null,
        artist: (s.artist as { name?: string })?.name ?? null,
        album: (s.album as { title?: string })?.title ?? null,
        durationSec: s.duration,
        source: "lyrics.ovh",
      })),
  ];
  return NextResponse.json({ results: out });
}

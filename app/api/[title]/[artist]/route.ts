import { NextResponse } from "next/server";
import { orchestrate } from "@/lib/providers/orchestrator";
import { cacheGet, cacheSet, cacheKeys } from "@/lib/cache";
import { checkRateLimit } from "@/lib/ratelimit";

// Lyrist-compat: GET /api/:title/:artist -> { lyrics, title, artist, image?, source }
export async function GET(
  req: Request,
  { params }: { params: Promise<{ title: string; artist: string }> },
) {
  const { title, artist } = await params;
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = await checkRateLimit(`compat:${ip}`);
  if (!rl.success) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }
  const t = decodeURIComponent(title ?? "");
  const a = decodeURIComponent(artist ?? "");
  if (!t || !a) {
    return NextResponse.json({ error: "Missing title/artist" }, { status: 400 });
  }
  const cacheKey = cacheKeys.lyrics(a, t);
  const cached = await cacheGet(cacheKey);
  if (cached) {
    const j = JSON.parse(cached);
    return NextResponse.json(toCompat(j));
  }
  const r = await orchestrate({ title: t, artist: a });
  if (!r?.plainLyrics) {
    return NextResponse.json({ error: "Lyrics not found" }, { status: 404 });
  }
  await cacheSet(cacheKey, JSON.stringify(r), 24 * 3600);
  return NextResponse.json(toCompat(r));
}

function toCompat(r: {
  title: string;
  artist: string;
  plainLyrics: string | null;
  artUrl?: string;
  source: string;
}) {
  return {
    lyrics: r.plainLyrics,
    title: r.title,
    artist: r.artist,
    image: r.artUrl ?? null,
    source: r.source,
  };
}

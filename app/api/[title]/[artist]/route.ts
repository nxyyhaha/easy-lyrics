import { NextResponse } from "next/server";
import { lookupLyrics } from "@/lib/songs";
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
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "Lyrics unavailable (no database configured)" },
      { status: 503 },
    );
  }
  const r = await lookupLyrics({ title: t, artist: a });
  if (!r?.plainLyrics) {
    return NextResponse.json({ error: "Lyrics not found" }, { status: 404 });
  }
  return NextResponse.json({
    lyrics: r.plainLyrics,
    title: r.title,
    artist: r.artist,
    image: r.artUrl ?? null,
    source: r.source,
  });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { lookupLyrics } from "@/lib/songs";
import { checkRateLimit } from "@/lib/ratelimit";

const Query = z.object({
  title: z.string().min(1).max(200),
  artist: z.string().min(1).max(200),
  syncedOnly: z.coerce.boolean().default(false),
});

export async function GET(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = await checkRateLimit(`lyrics:${ip}`);
  if (!rl.success) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }
  const url = new URL(req.url);
  const parsed = Query.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "Lyrics unavailable (no database configured)" },
      { status: 503 },
    );
  }
  const q = parsed.data;
  const result = await lookupLyrics({ title: q.title, artist: q.artist });
  if (!result || (!result.plainLyrics && !result.syncedLyrics)) {
    return NextResponse.json({ error: "Lyrics not found" }, { status: 404 });
  }
  if (q.syncedOnly && !result.syncedLyrics) {
    return NextResponse.json(
      { error: "Synced lyrics not found" },
      { status: 404 },
    );
  }
  return NextResponse.json(result);
}

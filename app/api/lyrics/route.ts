import { NextResponse } from "next/server";
import { z } from "zod";
import { orchestrate, type OrchestratedResult } from "@/lib/providers/orchestrator";
import { cacheGet, cacheSet, cacheKeys } from "@/lib/cache";
import { checkRateLimit } from "@/lib/ratelimit";

const Query = z.object({
  title: z.string().min(1).max(200),
  artist: z.string().min(1).max(200),
  album: z.string().max(200).optional(),
  duration: z.coerce.number().positive().max(7200).optional(),
  sources: z.string().optional(),
  includeSynced: z.coerce.boolean().default(true),
  syncedOnly: z.coerce.boolean().default(false),
  debug: z.coerce.boolean().default(false),
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
  const q = parsed.data;
  const cacheKey = cacheKeys.lyrics(q.artist, q.title);
  const cached = await cacheGet(cacheKey);
  if (cached) {
    const j = JSON.parse(cached);
    if (q.syncedOnly && !j.syncedLyrics) {
      // fall through to live lookup
    } else {
      return NextResponse.json(q.debug ? j : stripDebug(j));
    }
  }
  const result = await orchestrate(
    {
      title: q.title,
      artist: q.artist,
      album: q.album,
      durationSec: q.duration,
    },
    q.sources?.split(",").map((s) => s.trim()),
  );
  if (!result || (!result.plainLyrics && !result.syncedLyrics)) {
    return NextResponse.json({ error: "Lyrics not found" }, { status: 404 });
  }
  if (q.syncedOnly && !result.syncedLyrics) {
    return NextResponse.json(
      { error: "Synced lyrics not found", sourcesTried: result.sourcesTried },
      { status: 404 },
    );
  }
  await cacheSet(cacheKey, JSON.stringify(result), 24 * 3600);
  return NextResponse.json(q.debug ? result : stripDebug(result));
}

function stripDebug(r: OrchestratedResult) {
  const { sourcesTried: _t, ...rest } = r;
  void _t;
  return rest;
}

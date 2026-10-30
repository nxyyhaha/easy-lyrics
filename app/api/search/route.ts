import { NextResponse } from "next/server";
import { z } from "zod";
import { searchSongs } from "@/lib/songs";
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
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "Search unavailable (no database configured)" },
      { status: 503 },
    );
  }
  const results = await searchSongs(parsed.data.q);
  return NextResponse.json({ results });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { isLrcTimestamped, normalizeLrc } from "@/lib/lrc";
import { checkRateLimit } from "@/lib/ratelimit";

const Body = z.object({
  title: z.string().min(1).max(200),
  artist: z.string().min(1).max(200),
  plainLyrics: z.string().max(100_000).optional(),
  syncedLyrics: z.string().max(100_000).optional(),
  type: z.enum(["new", "correction", "sync"]).default("correction"),
  reason: z.string().max(1000).optional(),
  submitter: z.string().max(200).optional(),
}).refine((b) => b.plainLyrics || b.syncedLyrics, {
  message: "Provide plainLyrics and/or syncedLyrics",
});

// Submitters must identify themselves, e.g. "nxyy (https://nxyy.codes)".
const USER_AGENT = /^.{1,100}?\(https?:\/\/[^()\s]+\)\s*$/;

export async function POST(req: Request) {
  const ua = req.headers.get("user-agent") ?? "";
  if (!USER_AGENT.test(ua)) {
    return NextResponse.json(
      {
        error:
          'Missing or invalid User-Agent. Send one like "nxyy (https://nxyy.codes)".',
      },
      { status: 400 },
    );
  }
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = await checkRateLimit(`submit:${ip}`);
  if (!rl.success) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "Submissions unavailable (no database configured)" },
      { status: 503 },
    );
  }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const b = parsed.data;
  let synced = b.syncedLyrics?.trim() || null;
  if (synced) {
    if (!isLrcTimestamped(synced)) {
      return NextResponse.json(
        { error: "syncedLyrics must contain [mm:ss.xx] timestamps" },
        { status: 400 },
      );
    }
    synced = normalizeLrc(synced);
  }
  const { prisma } = await import("@/lib/db");
  const song = await prisma.song.upsert({
    where: { title_artist: { title: b.title, artist: b.artist } },
    update: {},
    create: { title: b.title, artist: b.artist },
  });
  const sub = await prisma.submission.create({
    data: {
      songId: song.id,
      title: b.title,
      artist: b.artist,
      plainLyrics: b.plainLyrics?.trim() || null,
      syncedLyrics: synced,
      type: b.type,
      reason: b.reason,
      submitter: b.submitter,
    },
  });
  return NextResponse.json({ id: sub.id, status: "pending" }, { status: 201 });
}

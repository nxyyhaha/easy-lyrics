import { NextResponse } from "next/server";
import { z } from "zod";
import { isLrcTimestamped, normalizeLrc } from "@/lib/lrc";
import { checkRateLimit } from "@/lib/ratelimit";
import { auth } from "@/lib/auth";

const Body = z.object({
  title: z.string().min(1).max(200),
  artist: z.string().min(1).max(200),
  plainLyrics: z.string().max(100_000).optional(),
  syncedLyrics: z.string().max(100_000).optional(),
  type: z.enum(["new", "correction", "sync"]).default("correction"),
  reason: z.string().max(1000).optional(),
}).refine((b) => b.plainLyrics || b.syncedLyrics, {
  message: "Provide plainLyrics and/or syncedLyrics",
});

// Contributions come from signed-in accounts: the session identifies the
// contributor, so no User-Agent guessing or free-text submitter names.
export async function POST(req: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "Submissions unavailable (no database configured)" },
      { status: 503 },
    );
  }
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json(
      { error: "Sign in to contribute" },
      { status: 401 },
    );
  }
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = await checkRateLimit(`submit:${session.user.id}:${ip}`);
  if (!rl.success) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
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
      userId: session.user.id,
      submitter: session.user.name || session.user.email,
    },
  });
  return NextResponse.json({ id: sub.id, status: "pending" }, { status: 201 });
}

// A contributor's own submission history, scoped to the signed-in session.
export async function GET(req: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "Submissions unavailable (no database configured)" },
      { status: 503 },
    );
  }
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Sign in to contribute" }, { status: 401 });
  }
  const { prisma } = await import("@/lib/db");
  const subs = await prisma.submission.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      title: true,
      artist: true,
      type: true,
      status: true,
      reason: true,
      createdAt: true,
      syncedLyrics: true,
    },
  });
  return NextResponse.json({
    submissions: subs.map((s) => ({ ...s, syncedLyrics: undefined, synced: !!s.syncedLyrics })),
  });
}

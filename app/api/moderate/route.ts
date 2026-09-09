import { NextResponse } from "next/server";
import { z } from "zod";

const Body = z.object({
  id: z.string().min(1),
  action: z.enum(["approve", "reject"]),
  note: z.string().max(1000).optional(),
});

function authorized(req: Request): boolean {
  const key = process.env.ADMIN_KEY;
  if (!key) return false;
  return (
    req.headers.get("x-admin-key") === key ||
    req.headers.get("authorization") === `Bearer ${key}`
  );
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "No database" }, { status: 503 });
  }
  const { prisma } = await import("@/lib/db");
  const subs = await prisma.submission.findMany({
    where: { status: "pending" },
    orderBy: { createdAt: "asc" },
    take: 50,
  });
  return NextResponse.json({ submissions: subs });
}

export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "No database" }, { status: 503 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const { prisma } = await import("@/lib/db");
  const sub = await prisma.submission.findUnique({
    where: { id: parsed.data.id },
  });
  if (!sub || sub.status !== "pending") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (parsed.data.action === "reject") {
    await prisma.$transaction([
      prisma.submission.update({
        where: { id: sub.id },
        data: { status: "rejected" },
      }),
      prisma.moderationLog.create({
        data: {
          submissionId: sub.id,
          action: "reject",
          note: parsed.data.note,
        },
      }),
    ]);
    return NextResponse.json({ id: sub.id, status: "rejected" });
  }
  // approve -> new approved version
  await prisma.$transaction([
    prisma.lyricsVersion.create({
      data: {
        songId: sub.songId!,
        plainLyrics: sub.plainLyrics,
        syncedLyrics: sub.syncedLyrics,
        instrumental: false,
        source: "community",
        status: "approved",
        createdBy: sub.submitter,
      },
    }),
    prisma.submission.update({
      where: { id: sub.id },
      data: { status: "approved" },
    }),
    prisma.moderationLog.create({
      data: { submissionId: sub.id, action: "approve", note: parsed.data.note },
    }),
  ]);
  return NextResponse.json({ id: sub.id, status: "approved" });
}

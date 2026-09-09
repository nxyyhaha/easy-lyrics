// Own DB provider — reads approved canonical versions from Neon first.
// Lazy: returns null when DATABASE_URL is unset (local dev without DB).
import { normalize, type LyricsQuery } from "@/lib/query";
import type { LyricsResult, Provider } from "./types";

export const ownDbProvider: Provider = {
  id: "own",
  async fetch(q: LyricsQuery): Promise<LyricsResult | null> {
    if (!process.env.DATABASE_URL) return null;
    try {
      const { prisma } = await import("@/lib/db");
      const song = await prisma.song.findFirst({
        where: {
          title: { equals: q.title, mode: "insensitive" },
          artist: { equals: q.artist, mode: "insensitive" },
        },
        include: {
          versions: {
            where: { status: "approved" },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      });
      const v = song?.versions?.[0];
      if (!song || !v || (!v.plainLyrics && !v.syncedLyrics)) return null;
      void normalize;
      return {
        title: song.title,
        artist: song.artist,
        plainLyrics: v.plainLyrics,
        syncedLyrics: v.syncedLyrics,
        instrumental: v.instrumental,
        source: "own",
        sourceUrl: v.sourceUrl ?? undefined,
        artUrl: song.artUrl ?? undefined,
        durationSec: song.durationSec ?? undefined,
      };
    } catch {
      return null;
    }
  },
};

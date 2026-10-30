// Reads against our own catalogue: the API only ever serves what lives in
// this project's database. Content gets here through /api/submit (signed-in
// contributors) and admin approval — never by polling another lyrics API.
import { prisma } from "@/lib/db";

export interface SongResult {
  title: string;
  artist: string;
  plainLyrics: string | null;
  syncedLyrics: string | null;
  instrumental: boolean;
  source: string;
  sourceUrl?: string;
  artUrl?: string;
  durationSec?: number;
}

export interface SongSuggestion {
  title: string;
  artist: string;
  album: string | null;
  durationSec: number | null;
  source: "own";
}

type Version = {
  plainLyrics: string | null;
  syncedLyrics: string | null;
  instrumental: boolean;
  source: string;
  sourceUrl: string | null;
};

// Newest approved version first: prefer one carrying both forms, then synced,
// then plain.
function pickVersion<T extends Version>(versions: T[]): T | null {
  return (
    versions.find((v) => v.plainLyrics && v.syncedLyrics) ??
    versions.find((v) => v.syncedLyrics) ??
    versions.find((v) => v.plainLyrics) ??
    null
  );
}

export async function lookupLyrics(q: {
  title: string;
  artist: string;
}): Promise<SongResult | null> {
  const song = await prisma.song.findFirst({
    where: {
      title: { equals: q.title, mode: "insensitive" },
      artist: { equals: q.artist, mode: "insensitive" },
    },
    include: {
      versions: {
        where: { status: "approved" },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!song) return null;
  const v = pickVersion(song.versions);
  if (!v || (!v.plainLyrics && !v.syncedLyrics && !v.instrumental)) return null;
  return {
    title: song.title,
    artist: song.artist,
    plainLyrics: v.plainLyrics,
    syncedLyrics: v.syncedLyrics,
    instrumental: v.instrumental,
    source: v.source,
    sourceUrl: v.sourceUrl ?? undefined,
    artUrl: song.artUrl ?? undefined,
    durationSec: song.durationSec ?? undefined,
  };
}

export async function searchSongs(
  term: string,
  limit = 10,
): Promise<SongSuggestion[]> {
  const songs = await prisma.song.findMany({
    where: {
      versions: { some: { status: "approved" } },
      OR: [
        { title: { contains: term, mode: "insensitive" } },
        { artist: { contains: term, mode: "insensitive" } },
      ],
    },
    select: { title: true, artist: true, album: true, durationSec: true },
    take: limit,
  });
  return songs.map((s) => ({ ...s, source: "own" as const }));
}

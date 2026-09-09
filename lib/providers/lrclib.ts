// LRCLIB — free, no key. Best synced source.
// Docs: https://lrclib.net/docs
// Port notes: mirror lrclib exact-match flow: /api/get with duration first,
// then /api/search fallback. Tolerance ±2s like LRCLIB server matching.
import { durationMatches, type LyricsQuery } from "@/lib/query";
import {
  fetchWithTimeout,
  type LyricsResult,
  type Provider,
} from "./types";

interface LrclibGet {
  id: number;
  trackName: string;
  artistName: string;
  albumName?: string;
  duration?: number;
  instrumental?: boolean;
  plainLyrics?: string;
  syncedLyrics?: string;
}

export const lrclibProvider: Provider = {
  id: "lrclib",
  async fetch(q: LyricsQuery): Promise<LyricsResult | null> {
    // 1. Exact get (supports duration-based disambiguation)
    const params = new URLSearchParams({
      artist_name: q.artist,
      track_name: q.title,
    });
    if (q.album) params.set("album_name", q.album);
    if (q.durationSec != null) params.set("duration", String(q.durationSec));
    try {
      const res = await fetchWithTimeout(
        `https://lrclib.net/api/get?${params}`,
        5000,
      );
      if (res.ok) {
        const j = (await res.json()) as LrclibGet;
        if (j && (j.plainLyrics || j.syncedLyrics || j.instrumental)) {
          if (!durationMatches(j.duration, q.durationSec, 5)) {
            // fall through to search for a better duration match
          } else {
            return {
              title: j.trackName ?? q.title,
              artist: j.artistName ?? q.artist,
              plainLyrics: j.plainLyrics || null,
              syncedLyrics: j.syncedLyrics || null,
              instrumental: !!j.instrumental,
              source: "lrclib",
              sourceUrl: `https://lrclib.net/api/get/${j.id}`,
              durationSec: j.duration,
            };
          }
        }
      }
    } catch {
      // fall through to search
    }
    // 2. Search fallback, pick best duration match
    try {
      const sq = new URLSearchParams({
        q: `${q.artist} ${q.title}`,
      });
      const res = await fetchWithTimeout(
        `https://lrclib.net/api/search?${sq}`,
        5000,
      );
      if (!res.ok) return null;
      const arr = (await res.json()) as LrclibGet[];
      if (!Array.isArray(arr) || arr.length === 0) return null;
      const ranked = [...arr].sort((a, b) => {
        const da =
          q.durationSec != null && a.duration != null
            ? Math.abs(a.duration - q.durationSec)
            : 999;
        const db =
          q.durationSec != null && b.duration != null
            ? Math.abs(b.duration - q.durationSec)
            : 999;
        return da - db;
      });
      const best = ranked[0];
      if (!best || (!best.plainLyrics && !best.syncedLyrics && !best.instrumental))
        return null;
      return {
        title: best.trackName ?? q.title,
        artist: best.artistName ?? q.artist,
        plainLyrics: best.plainLyrics || null,
        syncedLyrics: best.syncedLyrics || null,
        instrumental: !!best.instrumental,
        source: "lrclib",
        sourceUrl: `https://lrclib.net/api/get/${best.id}`,
        durationSec: best.duration,
      };
    } catch {
      return null;
    }
  },
};

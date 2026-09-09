// lyrics.ovh — free, no key, plain-only. Demoted to last-resort fallback
// since it never returns timestamps. GET https://api.lyrics.ovh/v1/:artist/:title
import type { LyricsQuery } from "@/lib/query";
import {
  fetchWithTimeout,
  type LyricsResult,
  type Provider,
} from "./types";

export const lyricsOvhProvider: Provider = {
  id: "lyrics.ovh",
  async fetch(q: LyricsQuery): Promise<LyricsResult | null> {
    try {
      const res = await fetchWithTimeout(
        `https://api.lyrics.ovh/v1/${encodeURIComponent(q.artist)}/${encodeURIComponent(q.title)}`,
        5000,
      );
      if (!res.ok) return null;
      const j = (await res.json()) as { lyrics?: string; error?: string };
      if (!j.lyrics || !j.lyrics.trim()) return null;
      return {
        title: q.title,
        artist: q.artist,
        plainLyrics: j.lyrics.trim(),
        syncedLyrics: null,
        instrumental: false,
        source: "lyrics.ovh",
      };
    } catch {
      return null;
    }
  },
};

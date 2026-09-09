// lrc.cx legacy JSON API — cheap last-mile LRC scraper.
// GET https://api.lrc.cx/jsonapi?artist=&title= (legacy, may be unstable)
import type { LyricsQuery } from "@/lib/query";
import { isLrcTimestamped, normalizeLrc, stripLrcToPlain } from "@/lib/lrc";
import {
  fetchWithTimeout,
  type LyricsResult,
  type Provider,
} from "./types";

export const lrccxProvider: Provider = {
  id: "lrc.cx",
  async fetch(q: LyricsQuery): Promise<LyricsResult | null> {
    try {
      const url =
        `https://api.lrc.cx/jsonapi?artist=${encodeURIComponent(q.artist)}` +
        `&title=${encodeURIComponent(q.title)}` +
        (q.album ? `&album=${encodeURIComponent(q.album)}` : "");
      const res = await fetchWithTimeout(url, 5000);
      if (!res.ok) return null;
      const j = await res.json();
      const raw: string | undefined = j?.syncedLyrics ?? j?.lrc ?? j?.lyrics;
      if (!raw) return null;
      if (isLrcTimestamped(raw)) {
        const lrc = normalizeLrc(raw);
        return {
          title: q.title,
          artist: q.artist,
          plainLyrics: stripLrcToPlain(lrc),
          syncedLyrics: lrc,
          instrumental: false,
          source: "lrc.cx",
        };
      }
      if (raw.trim().length > 20) {
        return {
          title: q.title,
          artist: q.artist,
          plainLyrics: raw.trim(),
          syncedLyrics: null,
          instrumental: false,
          source: "lrc.cx",
        };
      }
      return null;
    } catch {
      return null;
    }
  },
};

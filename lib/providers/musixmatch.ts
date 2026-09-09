// Musixmatch — best quality incl. word-by-word, but needs token and is
// ToS-sensitive. Disabled unless MUSIXMATCH_TOKEN is set. Kept behind env
// flag per plan; uses the syncedlyrics token-based flow (MIT, see NOTICE).
import type { LyricsQuery } from "@/lib/query";
import {
  fetchWithTimeout,
  type LyricsResult,
  type Provider,
} from "./types";

export const musixmatchProvider: Provider = {
  id: "musixmatch",
  async fetch(q: LyricsQuery): Promise<LyricsResult | null> {
    const token = process.env.MUSIXMATCH_TOKEN;
    if (!token) return null;
    try {
      const search = new URLSearchParams({
        q_artist: q.artist,
        q_track: q.title,
        apikey: token,
        f_has_lyrics: "1",
        s_track_rating: "desc",
        page_size: "3",
        page: "1",
      });
      const sres = await fetchWithTimeout(
        `https://api.musixmatch.com/ws/1.1/track.search?${search}`,
        5000,
      );
      if (!sres.ok) return null;
      const sj = await sres.json();
      const track = sj?.message?.body?.track_list?.[0]?.track as
        | { track_id: number; track_name: string; artist_name: string; has_subtitles?: number }
        | undefined;
      if (!track) return null;
      const sub = new URLSearchParams({
        track_id: String(track.track_id),
        apikey: token,
        subtitle_format: "lrc",
      });
      const lres = await fetchWithTimeout(
        `https://api.musixmatch.com/ws/1.1/track.subtitles.get?${sub}`,
        5000,
      );
      if (!lres.ok) return null;
      const lj = await lres.json();
      const body: string | undefined =
        lj?.message?.body?.subtitle?.subtitle_body;
      if (!body || !/\[\d{1,3}:\d{2}/.test(body)) return null;
      const { normalizeLrc, stripLrcToPlain } = await import("@/lib/lrc");
      const lrc = normalizeLrc(body);
      return {
        title: track.track_name ?? q.title,
        artist: track.artist_name ?? q.artist,
        plainLyrics: stripLrcToPlain(lrc),
        syncedLyrics: lrc,
        instrumental: false,
        source: "musixmatch",
        sourceUrl: `https://www.musixmatch.com/search/${encodeURIComponent(`${q.artist} ${q.title}`)}`,
      };
    } catch {
      return null;
    }
  },
};

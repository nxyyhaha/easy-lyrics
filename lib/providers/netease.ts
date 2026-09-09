// NetEase (music.163.com) — unofficial JSON API, no key, good LRC coverage.
// Endpoints used by moehmeni/syncedlyrics NetEase provider (MIT, see NOTICE):
//   POST https://music.163.com/api/search/pc {s, type:1}
//   GET  https://music.163.com/api/song/lyric?id=&lv=-1&kv=-1&tv=-1
// Lyric payload: { lrc: { lyric }, tlyric: { lyric }, yrc? } with [mm:ss.xxx].
// We keep the best duration match when `durationSec` is provided.
import { durationMatches, normalize, type LyricsQuery } from "@/lib/query";
import { normalizeLrc, stripLrcToPlain } from "@/lib/lrc";
import {
  fetchWithTimeout,
  type LyricsResult,
  type Provider,
} from "./types";

interface SearchSong {
  id: number;
  name: string;
  duration?: number;
  artists?: { name: string }[];
}

export async function searchNetease(
  q: LyricsQuery,
  limit = 5,
): Promise<SearchSong[]> {
  const res = await fetchWithTimeout("https://music.163.com/api/search/pc", 6000, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      s: `${q.artist} ${q.title}`,
      type: "1",
      limit: String(limit),
      offset: "0",
    }).toString(),
  });
  if (!res.ok) return [];
  const j = await res.json();
  return j?.result?.songs ?? [];
}

export function pickBestSong(
  songs: SearchSong[],
  q: LyricsQuery,
): SearchSong | null {
  if (songs.length === 0) return null;
  const scored = songs.map((s) => {
    const nameOk = normalize(s.name).includes(normalize(q.title).slice(0, 8));
    const artistOk = (s.artists ?? []).some((a) =>
      normalize(q.artist).includes(normalize(a.name).slice(0, 5)),
    );
    const durPenalty =
      q.durationSec != null && s.duration != null
        ? Math.abs(s.duration / 1000 - q.durationSec)
        : 50;
    return { s, score: (nameOk ? 0 : 100) + (artistOk ? 0 : 50) + durPenalty };
  });
  scored.sort((a, b) => a.score - b.score);
  const best = scored[0];
  if (!best) return null;
  if (
    q.durationSec != null &&
    best.s.duration != null &&
    !durationMatches(best.s.duration / 1000, q.durationSec, 10)
  ) {
    return null;
  }
  return best.s;
}

export async function fetchNeteaseLyric(
  id: number,
): Promise<{ lrc: string | null; plain: string | null }> {
  const res = await fetchWithTimeout(
    `https://music.163.com/api/song/lyric?id=${id}&lv=-1&kv=-1&tv=-1`,
    6000,
  );
  if (!res.ok) return { lrc: null, plain: null };
  const j = await res.json();
  const raw: string | undefined = j?.lrc?.lyric;
  if (!raw || !/\[\d{1,3}:\d{2}/.test(raw)) return { lrc: null, plain: null };
  const lrc = normalizeLrc(raw);
  return { lrc, plain: stripLrcToPlain(lrc) };
}

export const neteaseProvider: Provider = {
  id: "netease",
  async fetch(q: LyricsQuery): Promise<LyricsResult | null> {
    try {
      const songs = await searchNetease(q);
      const best = pickBestSong(songs, q);
      if (!best) return null;
      const { lrc, plain } = await fetchNeteaseLyric(best.id);
      if (!lrc) return null;
      return {
        title: best.name ?? q.title,
        artist: best.artists?.[0]?.name ?? q.artist,
        plainLyrics: plain,
        syncedLyrics: lrc,
        instrumental: false,
        source: "netease",
        sourceUrl: `https://music.163.com/song?id=${best.id}`,
        durationSec:
          best.duration != null ? Math.round(best.duration / 1000) : undefined,
      };
    } catch {
      return null;
    }
  },
};

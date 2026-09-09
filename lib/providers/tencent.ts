// Tencent/QQ Music (y.qq.com) — unofficial API, ported from
// syncedlyrics_aio Tencent provider (MIT, see NOTICE).
// Search: https://c.y.qq.com/soso/fcgi-bin/client_search_cp?w=&p=1&n=5
// Lyric:  https://c.y.qq.com/lyric/fcgi-bin/fcg_query_lyric_new.fcg?songmid=
// Lyric body is JSONP with base64-encoded `lyric` field of [mm:ss.xx] lines.
import { normalizeLrc, stripLrcToPlain } from "@/lib/lrc";
import type { LyricsQuery } from "@/lib/query";
import {
  fetchWithTimeout,
  type LyricsResult,
  type Provider,
} from "./types";

export function decodeQqLyricJsonp(jsonp: string): string | null {
  const m = jsonp.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    const j = JSON.parse(m[0]);
    const b64: string | undefined = j.lyric;
    if (!b64) return null;
    return Buffer.from(b64, "base64").toString("utf-8");
  } catch {
    return null;
  }
}

export const tencentProvider: Provider = {
  id: "tencent",
  async fetch(q: LyricsQuery): Promise<LyricsResult | null> {
    try {
      const sres = await fetchWithTimeout(
        `https://c.y.qq.com/soso/fcgi-bin/client_search_cp?w=${encodeURIComponent(`${q.artist} ${q.title}`)}&p=1&n=5&format=json`,
        6000,
      );
      if (!sres.ok) return null;
      const sj = await sres.json();
      const list = sj?.data?.song?.list as
        | { songmid: string; songname: string; singer: { name: string }[] }[]
        | undefined;
      if (!list?.length) return null;
      const best = list[0];
      const lres = await fetchWithTimeout(
        `https://c.y.qq.com/lyric/fcgi-bin/fcg_query_lyric_new.fcg?songmid=${best.songmid}&format=json&nobase64=0`,
        6000,
        { headers: { Referer: "https://y.qq.com" } },
      );
      if (!lres.ok) return null;
      const raw = decodeQqLyricJsonp(await lres.text());
      if (!raw || !/\[\d{1,3}:\d{2}/.test(raw)) return null;
      const lrc = normalizeLrc(raw);
      return {
        title: best.songname ?? q.title,
        artist: best.singer?.[0]?.name ?? q.artist,
        plainLyrics: stripLrcToPlain(lrc),
        syncedLyrics: lrc,
        instrumental: false,
        source: "tencent",
        sourceUrl: `https://y.qq.com/n/ryqq/songDetail/${best.songmid}`,
      };
    } catch {
      return null;
    }
  },
};

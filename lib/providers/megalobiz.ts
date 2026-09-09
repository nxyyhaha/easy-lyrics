// Megalobiz (megalobiz.com) — plain HTML pages embedding LRC blocks.
// Easiest LRC scraper: search page -> lyric page -> extract <pre>/lrc text.
// Logic inspired by moehmeni/syncedlyrics Megalobiz provider (MIT);
// ported to TS with cheerio. See NOTICE.
import * as cheerio from "cheerio";
import type { LyricsQuery } from "@/lib/query";
import { normalizeLrc, stripLrcToPlain } from "@/lib/lrc";
import {
  fetchWithTimeout,
  type LyricsResult,
  type Provider,
} from "./types";

export function extractLrcFromHtml(html: string): string | null {
  const $ = cheerio.load(html);
  // megalobiz renders lyrics inside pre.lrc or div with [mm:ss] content
  const candidates = [$("pre.lrc").text(), $("pre").text(), $(".lyrics").text()];
  for (const c of candidates) {
    if (c && /\[\d{1,3}:\d{2}/.test(c)) return normalizeLrc(c);
  }
  // fallback: any large text node with timestamps
  const body = $("body").text();
  const lines = body.split("\n").filter((l) => /\[\d{1,3}:\d{2}/.test(l));
  if (lines.length >= 3) return normalizeLrc(lines.join("\n"));
  return null;
}

export const megalobizProvider: Provider = {
  id: "megalobiz",
  async fetch(q: LyricsQuery): Promise<LyricsResult | null> {
    try {
      const searchUrl = `https://www.megalobiz.com/search/all?qry=${encodeURIComponent(`${q.artist} ${q.title}`)}&display=1`;
      const sres = await fetchWithTimeout(searchUrl, 6000);
      if (!sres.ok) return null;
      const $ = cheerio.load(await sres.text());
      const link =
        $("a[href*='/lrc/maker/'], a[href*='/lrc/']").first().attr("href") ??
        $("a").toArray().map((a) => $(a).attr("href")).find((h) => h?.includes("megalobiz.com"));
      if (!link) return null;
      const pageUrl = link.startsWith("http") ? link : `https://www.megalobiz.com${link}`;
      const pres = await fetchWithTimeout(pageUrl, 6000);
      if (!pres.ok) return null;
      const lrc = extractLrcFromHtml(await pres.text());
      if (!lrc) return null;
      return {
        title: q.title,
        artist: q.artist,
        plainLyrics: stripLrcToPlain(lrc),
        syncedLyrics: lrc,
        instrumental: false,
        source: "megalobiz",
        sourceUrl: pageUrl,
      };
    } catch {
      return null;
    }
  },
};

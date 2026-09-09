import { slug, type LyricsQuery } from "@/lib/query";
import { stripLrcToPlain } from "@/lib/lrc";
import { lrclibProvider } from "./lrclib";
import { lyricsOvhProvider } from "./lyricsOvh";
import { megalobizProvider } from "./megalobiz";
import { neteaseProvider } from "./netease";
import { tencentProvider } from "./tencent";
import { lrccxProvider } from "./lrccx";
import { musixmatchProvider } from "./musixmatch";
import { ownDbProvider } from "./own";
import type { Attempt, LyricsResult, Provider } from "./types";

export const DEFAULT_ORDER = [
  "own",
  "lrclib",
  "megalobiz",
  "netease",
  "tencent",
  "lrc.cx",
  "musixmatch",
  "lyrics.ovh",
] as const;

const REGISTRY: Record<string, Provider> = {
  own: ownDbProvider,
  lrclib: lrclibProvider,
  megalobiz: megalobizProvider,
  netease: neteaseProvider,
  tencent: tencentProvider,
  "lrc.cx": lrccxProvider,
  musixmatch: musixmatchProvider,
  "lyrics.ovh": lyricsOvhProvider,
};

export interface OrchestratedResult extends LyricsResult {
  sourcesTried: Attempt[];
}

export async function orchestrate(
  q: LyricsQuery,
  sources?: string[],
): Promise<OrchestratedResult | null> {
  const order = (sources?.length ? sources : [...DEFAULT_ORDER]).filter(
    (s) => REGISTRY[s],
  );
  const attempts: Attempt[] = [];
  let plain: LyricsResult | null = null;
  let synced: LyricsResult | null = null;

  for (const id of order) {
    const t0 = Date.now();
    try {
      const r = await REGISTRY[id].fetch(q);
      attempts.push({ source: id, ok: !!r, latencyMs: Date.now() - t0 });
      if (!r) continue;
      if (!plain && r.plainLyrics) plain = r;
      if (!synced && r.syncedLyrics) synced = r;
      if (plain?.plainLyrics && synced?.syncedLyrics) break;
    } catch (e) {
      attempts.push({
        source: id,
        ok: false,
        latencyMs: Date.now() - t0,
        error: e instanceof Error ? e.message : "unknown",
      });
    }
  }

  const base = synced ?? plain;
  if (!base) return null;
  const plainLyrics =
    plain?.plainLyrics ??
    (base.syncedLyrics ? stripLrcToPlain(base.syncedLyrics) : null);
  const merged: OrchestratedResult = {
    title: base.title,
    artist: base.artist,
    plainLyrics,
    syncedLyrics: synced?.syncedLyrics ?? null,
    instrumental: base.instrumental,
    source:
      plain && synced && plain.source !== synced.source
        ? "merged"
        : base.source,
    sourceUrl: (synced ?? plain)?.sourceUrl,
    artUrl: base.artUrl,
    durationSec: (synced ?? plain)?.durationSec,
    sourcesTried: attempts,
  };
  void slug;
  return merged;
}

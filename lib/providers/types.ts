import type { LyricsQuery } from "@/lib/query";

export interface LyricsResult {
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

export interface Provider {
  id: string;
  fetch(q: LyricsQuery): Promise<LyricsResult | null>;
}

export interface Attempt {
  source: string;
  ok: boolean;
  latencyMs: number;
  error?: string;
}

const UA =
  "easy-lyrics/0.1 (+https://github.com/easy-lyrics; contact: admin@easy-lyrics)";

export async function fetchWithTimeout(
  url: string,
  ms = 5000,
  init: RequestInit = {},
): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, {
      ...init,
      signal: ctrl.signal,
      headers: { "User-Agent": UA, ...(init.headers ?? {}) },
    });
  } finally {
    clearTimeout(t);
  }
}

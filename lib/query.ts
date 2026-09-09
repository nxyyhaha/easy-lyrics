export interface LyricsQuery {
  title: string;
  artist: string;
  album?: string;
  durationSec?: number;
}

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/\(feat\..*?\)|\(ft\..*?\)|\s+feat\..*$/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function slug(q: LyricsQuery): string {
  return `${normalize(q.artist)}::${normalize(q.title)}`;
}

export function durationMatches(
  a?: number,
  b?: number,
  toleranceSec = 2,
): boolean {
  if (a == null || b == null) return true;
  return Math.abs(a - b) <= toleranceSec;
}

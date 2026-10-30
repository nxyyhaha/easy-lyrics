const LRC_LINE = /^\s*\[(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?\](.*)$/;

export function isLrcTimestamped(text: string): boolean {
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  if (lines.length === 0) return false;
  const tagged = lines.filter((l) => LRC_LINE.test(l)).length;
  return tagged >= Math.min(3, lines.length) && tagged / lines.length > 0.5;
}

export function normalizeLrc(text: string): string {
  const out: string[] = [];
  for (const raw of text.split("\n")) {
    const m = raw.match(LRC_LINE);
    if (!m) continue;
    const mm = m[1].padStart(2, "0");
    const ss = m[2].padStart(2, "0");
    const frac = (m[3] ?? "00").slice(0, 2).padEnd(2, "0");
    out.push(`[${mm}:${ss}.${frac}]${m[4].trimEnd()}`);
  }
  return out.join("\n").trim();
}

export function stripLrcToPlain(synced: string): string {
  return synced
    .split("\n")
    .map((line) => {
      const m = line.match(LRC_LINE);
      return m ? m[4].trim() : line.trim();
    })
    .filter(Boolean)
    .join("\n")
    .trim();
}

export function isInstrumentalText(plain: string): boolean {
  return /^\s*\[?\s*instrumental\s*\]?\s*$/i.test(plain.trim());
}

/** A lyrics line being edited: text plus its timestamp in centiseconds. */
export interface TimedLine {
  text: string;
  cs: number | null;
}

/** Parse one line of plain or LRC text into text + timestamp (centiseconds). */
export function parseLrcLine(raw: string): TimedLine {
  const m = raw.match(LRC_LINE);
  if (!m) return { text: raw.trim(), cs: null };
  const frac = m[3] ?? "";
  const cs =
    frac.length <= 1
      ? Number(frac || "0") * 10
      : frac.length === 2
        ? Number(frac)
        : Math.floor(Number(frac) / 10);
  return { text: m[4].trim(), cs: Number(m[1]) * 6000 + Number(m[2]) * 100 + cs };
}

/** Format centiseconds as an LRC timestamp, e.g. 7450 -> "01:14.50". */
export function csToLrcTimestamp(cs: number): string {
  const total = Math.max(0, Math.round(cs));
  const mm = Math.floor(total / 6000);
  const ss = Math.floor((total % 6000) / 100);
  const cc = total % 100;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}.${String(cc).padStart(2, "0")}`;
}

/** Build LRC text from edited lines. Untimed lines are kept as plain text. */
export function buildLrcFromLines(lines: TimedLine[]): string {
  return lines
    .map((l) => (l.cs != null ? `[${csToLrcTimestamp(l.cs)}] ${l.text}` : l.text))
    .join("\n");
}

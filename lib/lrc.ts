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

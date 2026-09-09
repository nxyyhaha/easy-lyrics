import { describe, expect, it } from "vitest";
import { extractLrcFromHtml } from "@/lib/providers/megalobiz";

describe("megalobiz parser", () => {
  it("extracts LRC from pre block", () => {
    const html = `<html><body><pre class="lrc">[00:12.00] hello\n[00:15.00] world</pre></body></html>`;
    expect(extractLrcFromHtml(html)).toBe("[00:12.00] hello\n[00:15.00] world");
  });

  it("returns null without timestamps", () => {
    expect(extractLrcFromHtml("<html><body><p>no lyrics</p></body></html>")).toBeNull();
  });
});

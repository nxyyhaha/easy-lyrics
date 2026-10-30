// Render smoke test for the SoundCloud sync editor. Kept JSX-free so it runs
// under the existing node test environment.
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SyncEditor } from "@/components/sync-editor";

describe("sync editor", () => {
  it("renders parsed lines, LRC output and the transport", () => {
    const html = renderToString(
      createElement(SyncEditor, {
        initialLyrics: "[00:01.50] first line\nsecond line",
        onApply: () => {},
        onClose: () => {},
      }),
    );
    expect(html).toContain("Time it with the music");
    expect(html).toContain("first line");
    expect(html).toContain("second line");
    // stamped line keeps its timestamp, unstamped one shows the placeholder
    expect(html).toContain("00:01.50");
    expect(html).toContain("--:--.--");
    // one of two lines timed -> not enough to submit yet
    expect(html).toContain("Stamp most lines first");
  });
});

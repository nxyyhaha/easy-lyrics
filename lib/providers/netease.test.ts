import { describe, expect, it } from "vitest";
import { pickBestSong } from "@/lib/providers/netease";

describe("netease picker", () => {
  it("prefers duration match", () => {
    const songs = [
      { id: 1, name: "Beautiful", duration: 300_000, artists: [{ name: "Eminem" }] },
      { id: 2, name: "Beautiful", duration: 180_000, artists: [{ name: "Eminem" }] },
    ];
    const best = pickBestSong(songs, {
      title: "Beautiful",
      artist: "Eminem",
      durationSec: 300,
    });
    expect(best?.id).toBe(1);
  });

  it("rejects far duration mismatch", () => {
    const songs = [
      { id: 1, name: "Beautiful", duration: 60_000, artists: [{ name: "Eminem" }] },
    ];
    expect(
      pickBestSong(songs, { title: "Beautiful", artist: "Eminem", durationSec: 300 }),
    ).toBeNull();
  });
});

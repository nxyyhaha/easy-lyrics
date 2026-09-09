import { describe, expect, it } from "vitest";
import { decodeQqLyricJsonp } from "@/lib/providers/tencent";

describe("tencent decoder", () => {
  it("decodes base64 JSONP", () => {
    const raw = "[00:12.00] hello";
    const b64 = Buffer.from(raw).toString("base64");
    const jsonp = `MusicJsonCallback({"lyric":"${b64}"})`;
    expect(decodeQqLyricJsonp(jsonp)).toBe(raw);
  });

  it("returns null on garbage", () => {
    expect(decodeQqLyricJsonp("not jsonp")).toBeNull();
  });
});

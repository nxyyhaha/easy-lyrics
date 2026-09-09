import { describe, expect, it } from "vitest";
import {
  isLrcTimestamped,
  normalizeLrc,
  stripLrcToPlain,
} from "@/lib/lrc";

describe("lrc", () => {
  it("detects timestamped lyrics", () => {
    expect(
      isLrcTimestamped("[00:12.00] hello\n[00:15.00] world\n[00:18.00] !"),
    ).toBe(true);
    expect(isLrcTimestamped("just plain\nlyrics here")).toBe(false);
  });

  it("normalizes timestamps", () => {
    expect(normalizeLrc("[0:5.1] hi")).toBe("[00:05.10] hi");
  });

  it("strips to plain", () => {
    expect(stripLrcToPlain("[00:12.00] hello\n[00:15.00] world")).toBe(
      "hello\nworld",
    );
  });
});

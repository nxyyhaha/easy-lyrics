import { describe, expect, it } from "vitest";
import {
  buildLrcFromLines,
  csToLrcTimestamp,
  isLrcTimestamped,
  normalizeLrc,
  parseLrcLine,
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

describe("sync editor helpers", () => {
  it("parses plain and LRC lines into centiseconds", () => {
    expect(parseLrcLine("[01:14.50] hello")).toEqual({
      text: "hello",
      cs: 7450,
    });
    expect(parseLrcLine("[1:02] hi")).toEqual({ text: "hi", cs: 6200 });
    expect(parseLrcLine("[00:05.1] hi")).toEqual({ text: "hi", cs: 510 });
    expect(parseLrcLine("plain line")).toEqual({
      text: "plain line",
      cs: null,
    });
  });

  it("formats centiseconds as LRC timestamps", () => {
    expect(csToLrcTimestamp(7450)).toBe("01:14.50");
    expect(csToLrcTimestamp(510)).toBe("00:05.10");
    expect(csToLrcTimestamp(0)).toBe("00:00.00");
  });

  it("round-trips a line through build and parse", () => {
    const lrc = buildLrcFromLines([
      { text: "one", cs: 1500 },
      { text: "two", cs: null },
    ]);
    expect(lrc).toBe("[00:15.00] one\ntwo");
    expect(parseLrcLine(lrc.split("\n")[0])).toEqual({
      text: "one",
      cs: 1500,
    });
  });
});

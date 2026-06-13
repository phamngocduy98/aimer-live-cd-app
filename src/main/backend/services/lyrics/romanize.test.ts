import { describe, expect, test } from "vitest";
import { romanizeCues } from "./romanize.js";

describe("romanizeCues", () => {
  test("converts Japanese to spaced Hepburn romaji and preserves timing", async () => {
    const previous = process.env.E2E_TEST_MODE;
    delete process.env.E2E_TEST_MODE;
    const [cue] = await romanizeCues([{ startMs: 100, endMs: 900, text: "日本語" }]);
    expect(cue).toEqual({ startMs: 100, endMs: 900, text: expect.stringMatching(/nihongo/i) });
    if (previous == null) delete process.env.E2E_TEST_MODE;
    else process.env.E2E_TEST_MODE = previous;
  });
});

import { afterEach, describe, expect, test, vi } from "vitest";
import { translateCues } from "./translate.js";

describe("translateCues", () => {
  afterEach(() => vi.unstubAllGlobals());
  test("preserves timestamps for deterministic E2E translations", async () => {
    const previous = process.env.E2E_TEST_MODE;
    process.env.E2E_TEST_MODE = "true";
    await expect(
      translateCues([{ startMs: 10, endMs: 20, text: "日本語" }], "en", "mymemory")
    ).resolves.toEqual([{ startMs: 10, endMs: 20, text: "English preview 1" }]);
    if (previous == null) delete process.env.E2E_TEST_MODE;
    else process.env.E2E_TEST_MODE = previous;
  });

  test("reports the failed cue and returns no partial translation", async () => {
    delete process.env.E2E_TEST_MODE;
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ responseData: { translatedText: "first" } })
      })
      .mockResolvedValueOnce({ ok: false, status: 429, json: async () => ({}) });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      translateCues(
        [
          { startMs: 0, endMs: 1000, text: "一" },
          { startMs: 1000, endMs: 2000, text: "二" }
        ],
        "en",
        "mymemory"
      )
    ).rejects.toThrow("cue 2");
  });
});

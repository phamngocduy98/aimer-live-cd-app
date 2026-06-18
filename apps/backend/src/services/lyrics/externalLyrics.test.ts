import { afterEach, describe, expect, test, vi } from "vitest";
import { normalizeLrclibRecord, searchLrclib, sortCandidatesByDuration } from "./externalLyrics.js";

describe("LRCLIB normalization", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("normalizes synchronization and instrumental flags", () => {
    expect(
      normalizeLrclibRecord({
        id: 1,
        trackName: " Track ",
        artistName: " Artist ",
        albumName: " Album ",
        duration: 123,
        instrumental: true,
        syncedLyrics: "[00:00.00]text"
      })
    ).toEqual({
      id: 1,
      trackName: "Track",
      artistName: "Artist",
      albumName: "Album",
      duration: 123,
      instrumental: true,
      synchronized: true
    });
  });

  test("returns deterministic E2E candidates without network", async () => {
    const previous = process.env.E2E_TEST_MODE;
    process.env.E2E_TEST_MODE = "true";
    await expect(
      searchLrclib({ trackName: "Track", artistName: "Artist", duration: 120 })
    ).resolves.toEqual([
      expect.objectContaining({ trackName: "Track", synchronized: true, duration: 120 })
    ]);
    if (previous == null) delete process.env.E2E_TEST_MODE;
    else process.env.E2E_TEST_MODE = previous;
  });

  test("prefers the closest media duration", () => {
    const base = {
      id: 1,
      trackName: "Track",
      artistName: "Artist",
      albumName: "Album",
      instrumental: false,
      synchronized: true
    };
    expect(
      sortCandidatesByDuration(
        [
          { ...base, id: 1, duration: 180 },
          { ...base, id: 2, duration: 121 },
          { ...base, id: 3, duration: 100 }
        ],
        120
      ).map((candidate) => candidate.id)
    ).toEqual([2, 3, 1]);
  });

  test("retries a transient upstream failure", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("", { status: 503 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            {
              id: 7,
              trackName: "Track",
              artistName: "Artist",
              albumName: "Album",
              duration: 120,
              syncedLyrics: "[00:00.00]text"
            }
          ]),
          { status: 200 }
        )
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(searchLrclib({ trackName: "Track", artistName: "Artist" })).resolves.toHaveLength(
      1
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test("retries search without album after retryable failures", async () => {
    const timeout = Object.assign(new Error("The operation was aborted due to timeout"), {
      name: "TimeoutError"
    });
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(timeout)
      .mockResolvedValueOnce(new Response("[]", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      searchLrclib({
        trackName: "Track",
        artistName: "Artist",
        albumName: "Album"
      })
    ).resolves.toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[1][0])).not.toContain("album_name");
  });

  test("does not retry rate limits and reports final timeouts clearly", async () => {
    const rateLimited = vi.fn().mockResolvedValue(new Response("", { status: 429 }));
    vi.stubGlobal("fetch", rateLimited);
    await expect(searchLrclib({ trackName: "Track", artistName: "Artist" })).rejects.toThrow(
      "rate limit"
    );
    expect(rateLimited).toHaveBeenCalledTimes(1);

    const timeout = Object.assign(new Error("The operation was aborted due to timeout"), {
      name: "TimeoutError"
    });
    const timedOut = vi.fn().mockRejectedValue(timeout);
    vi.stubGlobal("fetch", timedOut);
    await expect(searchLrclib({ trackName: "Track", artistName: "Artist" })).rejects.toThrow(
      "timed out after 30 seconds"
    );
    expect(timedOut).toHaveBeenCalledTimes(2);
  });
});

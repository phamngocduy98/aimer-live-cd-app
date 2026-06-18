import { describe, expect, test } from "vitest";
import {
  buildUploadRows,
  getPartFileNames,
  mergeArtistNames,
  normalizeProviderPartNumbers
} from "./adminLogic.js";

describe("adminLogic", () => {
  test("buildUploadRows marks media healthy when union of host parts is complete", () => {
    const rows = buildUploadRows(
      [
        {
          hostId: "host-a",
          hostName: "Host A",
          available: true,
          files: [{ fileName: "song-1", partNumbers: [0, 2] }]
        },
        {
          hostId: "host-b",
          hostName: "Host B",
          available: true,
          files: [{ fileName: "song-1", partNumbers: [1] }]
        },
        {
          hostId: "host-c",
          hostName: "Host C",
          available: true,
          files: [{ fileName: "song-1", partNumbers: [] }]
        }
      ],
      new Map([
        ["song-1", { id: "song-1", title: "Song One", type: "song", fileCount: 3 }]
      ])
    );

    expect(rows).toEqual([
      expect.objectContaining({
        id: "song-1",
        healthy: true,
        health: "healthy",
        ha: 2,
        fileCount: 3,
        hosts: [
          { id: "host-a", name: "Host A", parts: [0, 2] },
          { id: "host-b", name: "Host B", parts: [1] }
        ],
        missingParts: []
      })
    ]);
  });

  test("normalizeProviderPartNumbers converts stream provider parts to zero-based admin parts", () => {
    expect(
      normalizeProviderPartNumbers([{ fileName: "song-1", partNumbers: [1, 3, 0] }])
    ).toEqual([{ fileName: "song-1", partNumbers: [0, 2] }]);
  });

  test("buildUploadRows treats a single zero-based admin part as complete for one-part media", () => {
    const rows = buildUploadRows(
      [
        {
          hostId: "host-a",
          hostName: "Host A",
          available: true,
          files: [{ fileName: "song-1", partNumbers: [0] }]
        }
      ],
      new Map([
        ["song-1", { id: "song-1", title: "Song One", type: "song", fileCount: 1 }]
      ])
    );

    expect(rows[0]).toEqual(
      expect.objectContaining({ healthy: true, health: "healthy", missingParts: [] })
    );
  });

  test("buildUploadRows reports missing parts and unknown metadata", () => {
    const rows = buildUploadRows(
      [
        {
          hostId: "host-a",
          hostName: "Host A",
          available: true,
          files: [
            { fileName: "song-1", partNumbers: [0] },
            { fileName: "orphan", partNumbers: [0] }
          ]
        }
      ],
      new Map([
        ["song-1", { id: "song-1", title: "Song One", type: "song", fileCount: 2 }]
      ])
    );

    expect(rows.find((row) => row.id === "song-1")).toEqual(
      expect.objectContaining({
        healthy: false,
        health: "missing-parts",
        fileCount: 2,
        missingParts: [1],
        hosts: [{ id: "host-a", name: "Host A", parts: [0] }]
      })
    );
    expect(rows.find((row) => row.id === "orphan")).toEqual(
      expect.objectContaining({
        healthy: false,
        health: "unknown",
        name: "Unknown",
        fileCount: 0,
        hosts: [{ id: "host-a", name: "Host A", parts: [0] }]
      })
    );
  });

  test("getPartFileNames builds uploaded part names", () => {
    expect(getPartFileNames("abc", 3, "flac")).toEqual(["abc.flac", "abc_1.flac", "abc_2.flac"]);
  });

  test("mergeArtistNames trims, deduplicates, and drops empty values", () => {
    expect(mergeArtistNames(["Aimer", " Aimer ", "", null, "Vaundy"])).toEqual([
      "Aimer",
      "Vaundy"
    ]);
  });
});

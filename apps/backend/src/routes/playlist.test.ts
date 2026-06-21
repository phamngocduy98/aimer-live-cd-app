import { afterEach, describe, expect, test, vi } from "vitest";
import { Playlist } from "../models/Playlist.js";
import {
  handleCreatePlaylist,
  handleListPlaylists,
  handleUpdatePlaylist
} from "./playlist.js";

const userId = "665000000000000000000502";

function response() {
  return {
    statusCode: 200,
    body: undefined as unknown,
    send(value: unknown) {
      this.body = value;
    },
    end() {}
  };
}

function request(overrides: Record<string, unknown> = {}) {
  return {
    auth: { user: { _id: userId } },
    body: {},
    params: {},
    ...overrides
  } as any;
}

describe("playlist route ownership", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("lists only playlists owned by the current user", async () => {
    const aggregate = vi.spyOn(Playlist, "aggregate").mockResolvedValue([]);
    const res = response();

    await handleListPlaylists(request(), res as any);

    expect(aggregate).toHaveBeenCalledWith(
      expect.arrayContaining([
        {
          $match: {
            userId: expect.objectContaining({
              toString: expect.any(Function)
            })
          }
        }
      ])
    );
    const match = aggregate.mock.calls[0][0][0] as any;
    expect(match.$match.userId.toString()).toBe(userId);
    expect(res.body).toEqual([]);
  });

  test("creates playlists for the current user", async () => {
    let savedPlaylist: InstanceType<typeof Playlist> | undefined;
    vi.spyOn(Playlist.prototype, "save").mockImplementation(async function saveMock() {
      savedPlaylist = this as InstanceType<typeof Playlist>;
      return this;
    });
    const res = response();

    await handleCreatePlaylist(
      request({ body: { name: "  Private Mix  ", description: "  Mine  " } }),
      res as any
    );

    expect(savedPlaylist?.userId.toString()).toBe(userId);
    expect(savedPlaylist?.name).toBe("Private Mix");
    expect(savedPlaylist?.description).toBe("Mine");
    expect(res.body).toMatchObject({ status: "success" });
  });

  test("updates by playlist id and current user id", async () => {
    const lean = vi.fn(() => ({ exec: vi.fn(async () => null) }));
    const findOneAndUpdate = vi.spyOn(Playlist, "findOneAndUpdate").mockReturnValue({ lean } as any);
    const res = response();

    await handleUpdatePlaylist(
      request({
        params: { id: "665000000000000000000401" },
        body: { name: "Other User Mix" }
      }),
      res as any
    );

    expect(findOneAndUpdate).toHaveBeenCalledWith(
      { _id: "665000000000000000000401", userId },
      { $set: { name: "Other User Mix" } },
      { new: true }
    );
    expect(res.body).toMatchObject({ status: "error", message: "Playlist not found" });
    expect(res.statusCode).toBe(404);
  });
});

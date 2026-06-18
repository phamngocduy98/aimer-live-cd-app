import { afterEach, describe, expect, test, vi } from "vitest";
import { User } from "../models/User.js";
import { buildRefreshCookie, createRefreshToken, hashPassword } from "../services/authService.js";
import { handleLogin, handleLogout, handleMe, handleRefresh } from "./auth.js";

function response() {
  return {
    statusCode: 200,
    headers: {} as Record<string, string | string[]>,
    body: undefined as unknown,
    ended: false,
    setHeader(name: string, value: string) {
      this.headers[name] = value;
    },
    json(value: unknown) {
      this.body = value;
    },
    send(value: unknown) {
      this.body = value;
    },
    end() {
      this.ended = true;
    }
  };
}

describe("auth routes", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("login sets a signed session cookie and returns the session", async () => {
    process.env.AUTH_SESSION_SECRET = "test-secret";
    const password = await hashPassword("password");
    const user = {
      id: "665000000000000000000501",
      _id: "665000000000000000000501",
      username: "admin",
      displayName: "Admin",
      enabled: true,
      role: "admin",
      passwordHash: password.hash,
      passwordSalt: password.salt,
      subscription: { plan: "admin", status: "active" },
      save: vi.fn()
    };
    vi.spyOn(User, "findOne").mockReturnValue({ exec: async () => user } as any);
    const res = response();

    await handleLogin({ body: { username: "admin", password: "password" } }, res);

    expect(res.headers["Set-Cookie"]).toEqual([
      expect.stringContaining("music_session="),
      expect.stringContaining("music_refresh=")
    ]);
    expect(res.body).toMatchObject({ canAccessAdmin: true, canAccessPaidMedia: true });
    expect(user.save).toHaveBeenCalled();
  });

  test("refresh rotates the refresh token and returns the session", async () => {
    process.env.AUTH_SESSION_SECRET = "test-secret";
    const refreshToken = createRefreshToken();
    const user = {
      id: "665000000000000000000501",
      _id: "665000000000000000000501",
      username: "admin",
      displayName: "Admin",
      enabled: true,
      role: "admin",
      subscription: { plan: "admin", status: "active" },
      save: vi.fn()
    };
    vi.spyOn(User, "findOne").mockReturnValue({ exec: async () => user } as any);
    const res = response();

    await handleRefresh({ headers: { cookie: buildRefreshCookie(refreshToken) } }, res);

    expect(res.headers["Set-Cookie"]).toEqual([
      expect.stringContaining("music_session="),
      expect.stringContaining("music_refresh=")
    ]);
    expect(res.body).toMatchObject({ canAccessAdmin: true, canAccessPaidMedia: true });
    expect(user.save).toHaveBeenCalled();
  });

  test("me returns the attached guest session", () => {
    const res = response();
    handleMe(
      {
        auth: { user: null, role: "guest", canAccessAdmin: false, canAccessPaidMedia: false }
      },
      res
    );

    expect(res.body).toMatchObject({ role: "guest", canAccessPaidMedia: false });
  });

  test("logout revokes refresh state and expires auth cookies", async () => {
    vi.spyOn(User, "updateOne").mockReturnValue({ exec: async () => ({ modifiedCount: 1 }) } as any);
    const res = response();
    await handleLogout({ headers: { cookie: buildRefreshCookie(createRefreshToken()) } }, res);

    expect(res.headers["Set-Cookie"]).toEqual([
      expect.stringContaining("music_session=;"),
      expect.stringContaining("music_refresh=;")
    ]);
    expect(res.body).toMatchObject({ status: "success" });
  });
});

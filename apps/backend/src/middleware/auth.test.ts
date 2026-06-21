import { describe, expect, test } from "vitest";
import { requireAdmin, requireAuthenticated, requirePaidMedia } from "./auth.js";

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

describe("auth middleware", () => {
  test("rejects authenticated routes for guests", () => {
    const res = response();
    requireAuthenticated(
      { auth: { user: null } } as any,
      res as any,
      () => {
        throw new Error("next should not run");
      }
    );

    expect(res.statusCode).toBe(401);
    expect(res.body).toMatchObject({ message: "Authentication required" });
  });

  test("allows authenticated routes for logged-in users", () => {
    let called = false;
    requireAuthenticated(
      { auth: { user: { _id: "user-1" } } } as any,
      response() as any,
      () => {
        called = true;
      }
    );

    expect(called).toBe(true);
  });

  test("rejects admin routes for non-admin sessions", () => {
    const res = response();
    requireAdmin(
      { auth: { user: { _id: "user-1" }, canAccessAdmin: false } } as any,
      res as any,
      () => {
        throw new Error("next should not run");
      }
    );

    expect(res.statusCode).toBe(403);
    expect(res.body).toMatchObject({ message: "Admin access required" });
  });

  test("allows paid media routes for paid sessions", () => {
    let called = false;
    requirePaidMedia(
      { auth: { user: { _id: "user-1" }, canAccessPaidMedia: true } } as any,
      response() as any,
      () => {
        called = true;
      }
    );

    expect(called).toBe(true);
  });
});

import { describe, expect, test, beforeEach } from "vitest";
import {
  createSessionToken,
  hashPassword,
  isPaidUser,
  verifyPassword,
  verifySessionToken
} from "./authService.js";

describe("auth service", () => {
  beforeEach(() => {
    process.env.AUTH_SESSION_SECRET = "test-secret";
  });

  test("hashes and verifies passwords with scrypt", async () => {
    const result = await hashPassword("correct horse battery staple");

    expect(await verifyPassword("correct horse battery staple", result.hash, result.salt)).toBe(
      true
    );
    expect(await verifyPassword("wrong", result.hash, result.salt)).toBe(false);
  });

  test("signs and verifies session tokens", () => {
    const token = createSessionToken("user-1");

    expect(verifySessionToken(token)?.userId).toBe("user-1");
    expect(verifySessionToken(`${token}tampered`)).toBeNull();
  });

  test("calculates paid access from role and subscription state", () => {
    expect(
      isPaidUser({
        enabled: true,
        role: "admin",
        subscription: { plan: "admin", status: "none" }
      } as any)
    ).toBe(true);
    expect(
      isPaidUser({
        enabled: true,
        role: "member",
        subscription: { plan: "plus", status: "active" }
      } as any)
    ).toBe(true);
    expect(
      isPaidUser({
        enabled: true,
        role: "member",
        subscription: { plan: "plus", status: "active", currentPeriodEnd: new Date("2000-01-01") }
      } as any)
    ).toBe(false);
  });
});

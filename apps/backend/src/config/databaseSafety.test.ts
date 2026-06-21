import { describe, expect, test } from "vitest";
import {
  DEFAULT_E2E_DB_NAME,
  assertSafeTestDbName,
  resolveE2eDbName
} from "./databaseSafety.js";

describe("databaseSafety", () => {
  test("uses the default E2E database when E2E_DB_NAME is not configured", () => {
    expect(resolveE2eDbName({ MONGO_DB_NAME: "musicbtxa" })).toBe(DEFAULT_E2E_DB_NAME);
  });

  test("honors a safe E2E database override", () => {
    expect(resolveE2eDbName({ E2E_DB_NAME: "musicbtxa_branch_test" })).toBe("musicbtxa_branch_test");
  });

  test("rejects unsafe database names", () => {
    expect(() => assertSafeTestDbName("musicbtxa")).toThrow(/unsafe E2E database/);
  });
});

import { describe, expect, it } from "vitest";
import { shouldApplyDailyRadioRequestLimit } from "./radioService.js";

describe("radio service", () => {
  it("applies the daily request limit to normal users", () => {
    expect(shouldApplyDailyRadioRequestLimit("665000000000000000000501", false)).toBe(true);
  });

  it("lets admins bypass the daily request limit", () => {
    expect(shouldApplyDailyRadioRequestLimit("665000000000000000000501", true)).toBe(false);
  });
});

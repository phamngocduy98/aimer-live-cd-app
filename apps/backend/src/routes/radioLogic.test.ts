import { describe, expect, it } from "vitest";
import { isRadioSlotExpired, nextRadioStartTime, radioPosition } from "./radioLogic.js";

describe("radio clock logic", () => {
  it("derives elapsed position from the authoritative server clock", () => {
    const slot = { startedAt: new Date("2026-06-21T00:00:00.000Z"), duration: 180 };

    expect(radioPosition(slot, new Date("2026-06-21T00:00:42.400Z"))).toBe(42);
  });

  it("expires slots when their duration has elapsed", () => {
    const slot = { startedAt: new Date("2026-06-21T00:00:00.000Z"), duration: 30 };

    expect(isRadioSlotExpired(slot, new Date("2026-06-21T00:00:29.999Z"))).toBe(false);
    expect(isRadioSlotExpired(slot, new Date("2026-06-21T00:00:30.000Z"))).toBe(true);
  });

  it("starts the next slot at the natural end or now, whichever is later", () => {
    const slot = { startedAt: new Date("2026-06-21T00:00:00.000Z"), duration: 30 };

    expect(nextRadioStartTime(slot, new Date("2026-06-21T00:00:10.000Z")).toISOString()).toBe(
      "2026-06-21T00:00:30.000Z"
    );
    expect(nextRadioStartTime(slot, new Date("2026-06-21T00:01:00.000Z")).toISOString()).toBe(
      "2026-06-21T00:01:00.000Z"
    );
  });
});

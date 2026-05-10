import { describe, it, expect } from "vitest";
import { getPartProvider } from "../../../services/stream/part-provider/index.js";
import { HttpStreamProvider } from "../../../services/stream/part-provider/HttpStreamProvider.js";
import { InfinitiveFreeHosting } from "../../../services/stream/part-provider/http-stream/InfiniteFreeHosting.js";
import { AwardspaceHosting } from "../../../services/stream/part-provider/http-stream/AwardspaceHosting.js";
import { HostingProvider } from "../../../models/Hosting.js";
import { createTestHosting, createHttpStreamConfig } from "../../testHelpers.js";

describe("getPartProvider", () => {
  it("returns HttpStreamProvider for HTTP stream config", () => {
    const hosting = createTestHosting({
      stream: createHttpStreamConfig(),
      provider: undefined
    });
    const provider = getPartProvider(hosting, {});
    expect(provider).toBeInstanceOf(HttpStreamProvider);
  });

  it("returns InfinitiveFreeHosting for INFINITVE_FREE provider", () => {
    const hosting = createTestHosting({
      stream: createHttpStreamConfig(),
      provider: HostingProvider.INFINITVE_FREE
    });
    const provider = getPartProvider(hosting, {});
    expect(provider).toBeInstanceOf(InfinitiveFreeHosting);
  });

  it("returns AwardspaceHosting for AWARD_SPACE provider", () => {
    const hosting = createTestHosting({
      stream: createHttpStreamConfig(),
      provider: HostingProvider.AWARD_SPACE
    });
    const provider = getPartProvider(hosting, {});
    expect(provider).toBeInstanceOf(AwardspaceHosting);
  });

  it("caches provider instance by hosting id", () => {
    const hosting = createTestHosting();
    const provider1 = getPartProvider(hosting, {});
    const provider2 = getPartProvider(hosting, {});
    expect(provider1).toBe(provider2);
  });

  it("throws for unknown stream strategy", () => {
    const hosting = createTestHosting();
    (hosting.stream as any).type = "unknown";
    expect(() => getPartProvider(hosting, {})).toThrow("Unknown stream strategy");
  });
});

import http from "http";

import { HostingProvider, IHosting } from "../../../models/Hosting.js";
import { AwardspaceHosting } from "./AwardspaceHosting.js";
import { StreamProvider } from "./StreamProvider.js";
import { InfinitiveFreeHosting } from "./InfFreeHosting.js";

const cached: Record<string, StreamProvider> = {};

export function getPartProvider(hosting: IHosting, headers: http.IncomingHttpHeaders) {
  if (cached[hosting.host] != null) {
    return cached[hosting.host];
  }

  if (hosting.provider === HostingProvider.INFINITVE_FREE) {
    return (cached[hosting.host] = new InfinitiveFreeHosting(hosting, headers));
  }
  if (hosting.provider === HostingProvider.AWARD_SPACE) {
    return (cached[hosting.host] = new AwardspaceHosting(hosting, headers));
  }
  return (cached[hosting.host] = new StreamProvider(hosting, headers));
}

import http from "http";

import {
  HostingProvider,
  IHosting,
  IHttpStreamConfig,
  StreamStrategy
} from "../../../models/Hosting.js";
import { AwardspaceHosting } from "./AwardspaceHosting.js";
import { HttpStreamProvider } from "./HttpStreamProvider.js";
import { StreamProvider } from "./StreamProvider.js";
import { InfinitiveFreeHosting } from "./InfFreeHosting.js";

const cached: Record<string, StreamProvider> = {};

function getCacheKey(hosting: IHosting): string {
  return (hosting as any)._id?.toString() ?? hosting.name;
}

export function getPartProvider(hosting: IHosting, headers: http.IncomingHttpHeaders) {
  const key = getCacheKey(hosting);
  if (cached[key] != null) {
    return cached[key];
  }

  const streamConfig = hosting.stream;

  if (streamConfig.type === StreamStrategy.HTTP) {
    const httpConfig = streamConfig as IHttpStreamConfig;
    if (hosting.provider === HostingProvider.INFINITVE_FREE) {
      return (cached[key] = new InfinitiveFreeHosting(httpConfig, headers));
    }
    if (hosting.provider === HostingProvider.AWARD_SPACE) {
      return (cached[key] = new AwardspaceHosting(httpConfig, headers));
    }
    return (cached[key] = new HttpStreamProvider(httpConfig, headers));
  }

  throw new Error(`Unknown stream strategy: ${(streamConfig as any)?.type}`);
}

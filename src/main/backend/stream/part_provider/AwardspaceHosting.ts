import http from "node:http";
import { HostingPartProvider } from "./HostingPartProvider.js";
import { AxiosResponse } from "axios";

export class AwardspaceHosting extends HostingPartProvider {
  token: string = "";
  async get(
    fileName: string,
    headers?: http.IncomingHttpHeaders,
    retryCount: number = 0
  ): Promise<AxiosResponse<any, any>> {
    if (fileName.endsWith(".mp3")) {
      return super.get(fileName + ".audio", headers, retryCount);
    }
    return super.get(fileName, headers, retryCount);
  }
}

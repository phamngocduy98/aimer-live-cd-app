import http from "node:http";
import { HttpStreamProvider } from "../HttpStreamProvider.js";
import { AxiosResponse } from "axios";

export class AwardspaceHosting extends HttpStreamProvider {
  async get(
    fileName: string,
    headers?: http.IncomingHttpHeaders,
    retryCount: number = 0,
    responseType: "stream" | "text" = "stream",
    hostPath?: string
  ): Promise<AxiosResponse<any, any>> {
    if (fileName.endsWith(".mp3")) {
      return super.get(fileName + ".audio", headers, retryCount, responseType, hostPath);
    }
    return super.get(fileName, headers, retryCount, responseType, hostPath);
  }
}

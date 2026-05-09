import http from "node:http";
import { StreamProvider } from "./StreamProvider.js";
import { resp2string } from "../../lib/stream/stream2buffer.js";
import { byPassHosting } from "./inffree/bypass.js";
import { AxiosResponse } from "axios";

export class InfinitiveFreeHosting extends StreamProvider {
  token: string = "";
  async get(
    fileName: string,
    headers?: http.IncomingHttpHeaders,
    retryCount: number = 0,
    responseType: "stream" | "text" = "stream",
    hostPath: string = `${this.hosting.host}${this.hosting.path}`
  ): Promise<AxiosResponse<any, any>> {
    // if (fileName.endsWith(".flac")) {
    //   // TODO: load hosting.ftpExt from DB and get proper file name extension.
    //   return super.get(fileName + ".mp3", headers, retryCount, responseType, hostPath);
    // }
    return super.get(
      fileName,
      {
        ...headers,
        Cookie: `__test=${this.token}`,
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36"
      },
      retryCount,
      responseType,
      hostPath
    );
  }

  async handleResponse(
    statusCode: number | undefined,
    res: AxiosResponse<any, any>,
    responseType: "stream" | "text" = "stream"
  ) {
    // call super to handle 404
    const superres = await super.handleResponse(statusCode, res, responseType);

    if (res.headers["content-type"]?.includes("text/html")) {
      if (superres.data.includes("aes.js")) {
        // console.log("Refreshing token");
        this.token = await byPassHosting.refreshToken(`http://${this.hosting.host}`);
        throw Error("Token refreshed. Please try again");
      } else if (superres.data.includes("errors/404")) {
        throw Error("404 Not found");
      }
    }

    return superres;
  }
}

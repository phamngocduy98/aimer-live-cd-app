import { v2 as webdav } from "webdav-server";
import { StreamFSSerializer, StreamFileSystem } from "./StreamFileSystem.js";

export class WebdavServer {
  server = new webdav.WebDAVServer();
  constructor() {}
  async init() {
    // this.server.afterRequest((arg, next) => {
    //   console.log(
    //     ">>",
    //     arg.request.method,
    //     arg.fullUri(),
    //     ">",
    //     arg.response.statusCode,
    //     arg.response.statusMessage.length
    //   );
    //   next();
    // });

    await this.server.setFileSystemAsync("Albums", new StreamFileSystem(""));
  }
}

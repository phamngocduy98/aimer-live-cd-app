import { MediaUploader } from "./MediaUploader.js";

import { IHosting } from "../db/Hosting.js";
import { WithDocument } from "../utils/type.js";
import { MyFtp } from "./MyFtp.js";

export class FtpMediaUploader extends MediaUploader {
  ftpClient: MyFtp | null = null;
  ftpRoot: string = "";

  async init(hosting: WithDocument<IHosting>): Promise<void> {
    await super.init(hosting);
    this.ftpRoot = hosting.ftpRoot;

    this.ftpClient = new MyFtp(hosting.ftpCredential);
    await this.ftpClient.connect();
  }

  async uploadFile(upBuff: Buffer, getFileName: () => string): Promise<string> {
    if (this.ftpClient == null) throw Error("FTP client not init");
    const fileName = getFileName();
    try {
      await this.ftpClient.put(`${this.ftpRoot}/${fileName}`, upBuff);
      return fileName;
    } catch (e) {
      if (e instanceof Error && e.message.includes("Forbidden filename")) {
        return this.uploadFile(upBuff, getFileName);
      }
      console.error(e);
      throw e;
    }
  }

  async end(): Promise<void> {
    this.ftpClient?.end();
  }
}

import { MediaUploader } from "./MediaUploader.js";

import { IFtpCredential } from "../db/Hosting.js";
import { MyFtp } from "./MyFtp.js";

export class FtpMediaUploader extends MediaUploader {
  ftpClient: MyFtp | null = null;
  ftpRoot: string = "";
  path: string = "";

  async init(ftpRoot: string, path: string, ftpCredential: IFtpCredential, ftpLimit: number, ftpExt: string[]): Promise<void> {
    this.uploadLimit = ftpLimit;
    this.allowedExt = ftpExt.filter((ext) => ext[0] === "+");
    this.deniedExt = ftpExt.filter((ext) => ext[0] === "-");

    this.ftpRoot = ftpRoot;
    this.path = path;

    this.ftpClient = new MyFtp(ftpCredential);
    await this.ftpClient.connect();
  }

  async uploadFile(upBuff: Buffer, getFileName: () => string, uploadPath?: string): Promise<string> {
    if (this.ftpClient == null) throw Error("FTP client not init");
    const fileName = getFileName();
    const pathToUse = uploadPath ?? this.path;
    try {
      await this.ftpClient.put(`${this.ftpRoot}${pathToUse}/${fileName}`, upBuff);
      return fileName;
    } catch (e) {
      if (e instanceof Error && e.message.includes("Forbidden filename")) {
        return this.uploadFile(upBuff, getFileName, uploadPath);
      }
      console.error(e);
      throw e;
    }
  }

  async end(): Promise<void> {
    this.ftpClient?.end();
  }
}

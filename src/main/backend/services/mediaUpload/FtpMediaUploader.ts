import { MediaUploader } from "./MediaUploader.js";

import { UploadConfig, UploadStrategy } from "../../models/Hosting.js";
import { MyFtp } from "./MyFtp.js";
import { createLogger } from "../../utils/log.js";

const log = createLogger("FTP Upload");

export class FtpMediaUploader extends MediaUploader {
  ftpClient: MyFtp | null = null;
  ftpRoot: string = "";
  path: string = "";

  async init(config: UploadConfig): Promise<void> {
    if (config.type !== UploadStrategy.FTP) {
      throw new Error(`FtpMediaUploader requires FTP upload config, got ${config.type}`);
    }

    this.uploadLimit = config.ftpLimit;
    this.allowedExt = config.ftpExt.filter((ext) => ext[0] === "+");
    this.deniedExt = config.ftpExt.filter((ext) => ext[0] === "-");

    this.ftpRoot = config.ftpRoot;
    this.path = config.path;

    this.ftpClient = new MyFtp(config.ftpCredential);
    await this.ftpClient.connect();
  }

  async uploadFile(
    upBuff: Buffer,
    getFileName: () => string,
    uploadPath?: string
  ): Promise<string> {
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
      log.error({ err: e }, "FTP upload failed");
      throw e;
    }
  }

  async deleteFiles(fileNames: string[], uploadPath?: string): Promise<void> {
    if (this.ftpClient == null) throw Error("FTP client not init");
    const pathToUse = uploadPath ?? this.path;
    for (const fileName of fileNames) {
      try {
        await this.ftpClient.delete(`${this.ftpRoot}${pathToUse}/${fileName}`);
      } catch (error) {
        const err = error as { code?: number; message?: string };
        if (err.code === 550 || err.message?.includes("No such file")) continue;
        throw error;
      }
    }
  }

  async end(): Promise<void> {
    this.ftpClient?.end();
  }
}

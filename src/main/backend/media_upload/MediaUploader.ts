import { Readable } from "stream";

import { getAesStream, PARTSIZE } from "../const.js";
import { IHosting } from "../db/Hosting.js";
import { WithDocument } from "../utils/type.js";

const extList: string[] = [".audio", ".unknown", ".jpg", ".png"];

export class MediaUploader {
  uploadLimit: number = Number.MAX_VALUE;
  allowedExt: string[] = [];
  deniedExt: string[] = [];
  /**
   * @return fileNames of uploaded file
   */
  async encryptAndUpload(
    buffer: Buffer,
    name: string,
    ext: string,
    iv: Buffer,
    skipPart?: number,
    limitPart?: number
  ): Promise<{ fileCount: number }> {
    return this.upload(
      buffer,
      name,
      ext,
      (buff) => getAesStream().createEncryptStream(Readable.from(buff), iv),
      skipPart,
      limitPart
    );
  }

  // ext: extension starting with dot (eg: .mp3)
  getUploadExt(uploadExt: string) {
    let i = 0;
    if (this.allowedExt.length > 0) {
      return () => {
        if (i >= this.allowedExt.length) throw Error(`hosting.allowedExt`);
        return this.allowedExt[i++].slice(1);
      };
    }
    const mExtList = !this.deniedExt.includes(uploadExt) ? [uploadExt, ...extList] : extList;
    return () => {
      if (i >= mExtList.length) throw Error("FtpMediaUploader.mExtList");
      return mExtList[i++].slice(1);
    };
  }

  /* upload */
  async upload(
    buffer: Buffer,
    name: string,
    ext: string,
    encryption: (buff: Buffer) => Readable | Buffer = (buff) => buff,
    skipPart: number = 0,
    limitPart: number = Number.MAX_VALUE
  ): Promise<{ fileCount: number }> {
    const partSize = Math.min(PARTSIZE, this.uploadLimit);
    const maxFileCount = Math.ceil(buffer.length / partSize);

    let byteRemain = buffer.length;
    let offset = 0;
    let partNo = 0;

    while (byteRemain > 0) {
      const upBuff = buffer.subarray(offset, offset + partSize);
      byteRemain -= partSize;
      offset += partSize;

      let partName = name;
      if (partNo > 0) partName += `_${partNo}`;
      if (partNo >= skipPart && partNo - skipPart < limitPart) {
        let retry = 0;
        while (true) {
          try {
            const fileName = await this.uploadFile(
              encryption(upBuff),
              () => `${partName}.${this.getUploadExt(`.${ext}`)()}`
            );

            console.log(`[ ${`Part ${partNo}/${maxFileCount}`.padStart(15)} ] ${fileName}`);
            break;
          } catch (e) {
            if (++retry > 3) throw Error("Max try exceeded");
            // delay random 1-30s
            await new Promise((rs) => setTimeout(rs, 1000 + Math.floor(Math.random() * 30000)));
            console.log(`[ ${`Part ${partNo}/${maxFileCount}`.padStart(15)} ] Retry ${retry}/3`);
          }
        }
      } else {
        console.log(`[ ${`Part ${partNo}/${maxFileCount}`.padStart(15)} ] SKIP`);
      }
      partNo++;
    }
    await this.end();
    return { fileCount: partNo };
  }

  async init(hosting: WithDocument<IHosting>) {
    this.uploadLimit = hosting.ftpLimit;

    this.allowedExt = hosting.ftpExt.filter((ext) => ext[0] === "+");
    this.deniedExt = hosting.ftpExt.filter((ext) => ext[0] === "-");
  }

  async uploadFile(upBuff: Readable | Buffer, getFileName: () => string): Promise<string> {
    throw Error("Not implemented");
  }

  async end() {}
}

import { Readable } from "stream";

import { getAesStream, PARTSIZE } from "../../config/const.js";
import { UploadConfig } from "../../models/Hosting.js";
import { createLogger } from "../../utils/log.js";

const log = createLogger("Part");

const extList: string[] = [".audio", ".unknown", ".jpg", ".png"];

export abstract class MediaUploader {
  uploadLimit: number = Number.MAX_VALUE;
  allowedExt: string[] = [];
  deniedExt: string[] = [];

  abstract init(config: UploadConfig): Promise<void>;

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

  getUploadExt(uploadExt: string) {
    let i = 0;
    if (this.allowedExt.length > 0) {
      return () => {
        if (i >= this.allowedExt.length) throw Error(`hosting.allowedExt`);
        return this.allowedExt[i++].slice(1);
      };
    }
    const deniedExtList = this.deniedExt.map((e) => `.${e.slice(1)}`);
    const mExtList = !deniedExtList.includes(uploadExt) ? [uploadExt, ...extList] : extList;
    return () => {
      if (i >= mExtList.length) throw Error("FtpMediaUploader.mExtList");
      return mExtList[i++].slice(1);
    };
  }

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

            log.info(`Part ${partNo}/${maxFileCount} ${fileName}`);
            break;
          } catch (e) {
            if (++retry > 3) throw Error("Max try exceeded");
            await new Promise((rs) => setTimeout(rs, 1000 + Math.floor(Math.random() * 30000)));
            log.warn(`Part ${partNo}/${maxFileCount} Retry ${retry}/3`);
          }
        }
      } else {
        log.info(`Part ${partNo}/${maxFileCount} SKIP`);
      }
      partNo++;
    }
    await this.end();
    return { fileCount: partNo };
  }

  abstract uploadFile(
    upBuff: Readable | Buffer,
    getFileName: () => string,
    uploadPath?: string
  ): Promise<string>;

  async end() {}
}

// base on https://github.com/wangsijie/aes-encrypt-stream/blob/master/src/index.ts

import * as crypto from "crypto";
import { Transform, Stream, Writable, Readable } from "stream";

export class AesStream {
  password: Buffer;
  constructor(
    private algorithm: string = "aes-256-ctr",
    password: string
  ) {
    this.password = Buffer.from(password, "hex");
    if (!Buffer.isBuffer(this.password) || this.password.length !== 32) {
      throw new Error("password should be 32 length buffer");
    }
  }

  static generatePassword() {
    return crypto.randomBytes(32).toString("hex");
  }

  incrementBuffer(buf: Buffer, cnt: number) {
    var i, len, mod;
    len = buf.length;
    i = len - 1;
    while (cnt !== 0) {
      mod = (cnt + buf[i]) % 256;
      cnt = Math.floor((cnt + buf[i]) / 256);
      buf[i] = mod;
      i -= 1;
      if (i < 0) {
        i = len - 1;
      }
    }
    return buf;
  }

  createEncryptStream(input: Readable, iv: Buffer): Readable {
    const encryptStream = crypto.createCipheriv(this.algorithm, this.password, iv);
    return input.pipe(encryptStream);
  }

  /**
   *
   * @param input Readable
   * @param iv Buffer
   * @param ivSkip number of [128bit (16bytes)] blocks to skip.
   * @returns
   */
  createDecryptStream2(input: Readable, iv: Buffer, ivSkip: number = 0): Readable {
    const decryptStream = crypto.createDecipheriv(
      this.algorithm,
      this.password,
      this.incrementBuffer(iv, ivSkip)
    );
    return input.pipe(decryptStream);
  }

  // createDecryptStream(output: Writable, iv: Buffer): Writable {
  //   const decryptStream = crypto.createDecipheriv(
  //     this.algorithm,
  //     this.password,
  //     iv
  //   );
  //   let init = false;
  //   return new Transform({
  //     transform(chunk, encoding, callback) {
  //       if (!init) {
  //         this.pipe(decryptStream).pipe(output);
  //         this.push(chunk);
  //         init = true;
  //       } else {
  //         this.push(chunk);
  //       }
  //       callback();
  //     },
  //   });
  // }
}

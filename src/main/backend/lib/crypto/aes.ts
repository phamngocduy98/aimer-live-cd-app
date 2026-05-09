import crypto from "crypto";

export class Aes {
  key: Buffer;
  iv: Buffer;
  constructor(password: string) {
    this.key = Buffer.from(password, "hex");
    if (!Buffer.isBuffer(this.key) || this.key.length !== 32) {
      throw new Error("password should be 32 length buffer");
    }
    // this.key = crypto.randomBytes(32);
    this.iv = Buffer.alloc(16, 0);
  }

  encrypt(m: string) {
    const cipher = crypto.createCipheriv("aes-256-cbc", this.key, this.iv);
    return cipher.update(m, "utf-8", "hex") + cipher.final("hex");
  }

  decrypt(m: string) {
    const decipher = crypto.createDecipheriv("aes-256-cbc", this.key, this.iv);
    return decipher.update(m, "hex", "utf-8") + decipher.final("utf8");
  }
}

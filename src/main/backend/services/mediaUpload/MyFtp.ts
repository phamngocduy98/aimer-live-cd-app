import { Readable } from "stream";
import ftp from "ftp";

export class MyFtp {
  private ftpClient: ftp;
  constructor(private options: ftp.Options) {
    this.ftpClient = new ftp();
  }

  connect() {
    return new Promise<void>((rs, rj) => {
      try {
        this.ftpClient.once("ready", rs);
        this.ftpClient.once("error", rj);
        this.ftpClient.connect(this.options);
      } catch (e) {
        rj(e);
      }
    });
  }

  mkdir(path: string) {
    return new Promise<void>((rs, rj) => {
      this.ftpClient.mkdir(path, (err) => {
        if (err) return rj(err);
        rs();
      });
    });
  }

  put(path: string, stream: Readable | Buffer) {
    return new Promise<void>((rs, rj) => {
      this.ftpClient.put(stream, path, (err) => {
        if (err) return rj(err);
        rs();
      });
    });
  }

  end() {
    this.ftpClient.end();
  }
}

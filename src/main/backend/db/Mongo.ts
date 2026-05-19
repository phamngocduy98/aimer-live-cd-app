import mongoose, { connect } from "mongoose";
import { Aes } from "../utils/crypto/aes.js";
import { DbDocument } from "../types/type.js";
import { Hosting, IHosting } from "../models/Hosting.js";
import { createLogger } from "../utils/log.js";

const log = createLogger("MongoDB");

/**
 * Singleton DbClient class
 * Đảm bảo chỉ có một instance duy nhất trong toàn bộ ứng dụng
 */
class DbClient {
  private _dbStorePw?: string;
  private _isConnected: boolean = false;

  /**
   * Kiểm tra xem đã kết nối đến database chưa
   */
  get isConnected(): boolean {
    return this._isConnected;
  }

  /**
   * Kết nối đến MongoDB
   */
  async connect(): Promise<void> {
    if (this._isConnected) {
      log.debug("Already connected to MongoDB");
      return;
    }

    const dbhost = process.env.MONGO_DB_HOST;
    const dbusername = process.env.MONGO_DB_USER;
    const dbpassword = process.env.MONGO_DB_PW;

    const dbStorePw = process.env.DB_STORE_PW;
    if (dbStorePw == null) {
      throw new Error("Missing DB_STORE_PW environment variable");
    }
    this._dbStorePw = dbStorePw;

    if (dbhost == null || dbusername == null || dbpassword == null) {
      throw new Error("Missing MongoDB environment variables");
    }

    try {
      mongoose.set("strictQuery", true);
      const uri = `mongodb+srv://${dbusername}:${dbpassword}@${dbhost}/?retryWrites=true&w=majority`;
      await connect(uri, {
        dbName: "musicbtxa"
      });
      this._isConnected = true;
      log.info("Connected to MongoDB");
    } catch (error) {
      log.error({ err: error }, "Failed to connect to MongoDB");
      throw error;
    }
  }

  private decryptHostingPasswords(hosting: DbDocument<IHosting>, aes: Aes): void {
    if (hosting.upload?.type === "ftp") {
      hosting.upload.ftpCredential.password = aes.decrypt(hosting.upload.ftpCredential.password);
    } else if ((hosting as any).ftpCredential) {
      (hosting as any).ftpCredential.password = aes.decrypt(
        (hosting as any).ftpCredential.password
      );
    }
  }

  async listHosting(): Promise<DbDocument<IHosting>[]> {
    if (!this._isConnected) {
      await this.connect();
    }
    if (this._dbStorePw == null) {
      throw new Error("Missing DB_STORE_PW environment variable");
    }

    const hostingsList = await Hosting.find({});
    const aes = new Aes(this._dbStorePw);
    hostingsList.forEach((h) => this.decryptHostingPasswords(h, aes));
    return hostingsList;
  }

  async findHosting(hostId: string): Promise<DbDocument<IHosting> | null> {
    if (!this._isConnected) {
      await this.connect();
    }
    if (this._dbStorePw == null) {
      throw new Error("Missing DB_STORE_PW environment variable");
    }

    const hosting = await Hosting.findById(hostId);
    if (hosting === null) return null;

    this.decryptHostingPasswords(hosting, new Aes(this._dbStorePw));
    return hosting;
  }
}

// Export instance duy nhất của DbClient
export const dbClient = new DbClient();

import mongoose, { connect } from "mongoose";
import { Aes } from "../crypto/aes.js";
import { DbDocument } from "../utils/type.js";
import { Hosting, IHosting } from "./Hosting.js";

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
      console.log("Already connected to MongoDB");
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
      console.log("Connected to MongoDB");
    } catch (error) {
      console.error("Failed to connect to MongoDB:", error);
      throw error;
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
    hostingsList.forEach((h) => (h.ftpCredential.password = aes.decrypt(h.ftpCredential.password)));
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

    hosting.ftpCredential.password = new Aes(this._dbStorePw).decrypt(
      hosting.ftpCredential.password
    );
    return hosting;
  }
}

// Export instance duy nhất của DbClient
export const dbClient = new DbClient();

import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

import mongoose, { connect } from "mongoose";
import { Hosting } from "../models/Hosting.js";

async function migrateHostingModel() {
  const dbhost = process.env.MONGO_DB_HOST;
  const dbusername = process.env.MONGO_DB_USER;
  const dbpassword = process.env.MONGO_DB_PW;

  if (!dbhost || !dbusername || !dbpassword) {
    console.error("Missing MongoDB environment variables");
    process.exit(1);
  }

  mongoose.set("strictQuery", true);
  const uri = `mongodb+srv://${dbusername}:${dbpassword}@${dbhost}/?retryWrites=true&w=majority`;
  await connect(uri, { dbName: "musicbtxa" });

  const allHostings = await Hosting.find({}).lean();
  let migrated = 0;
  let alreadyMigrated = 0;

  for (const doc of allHostings) {
    const raw = doc as any;

    // Skip if already in new format
    if (raw.upload && raw.stream) {
      alreadyMigrated++;
      continue;
    }

    const name = raw.name ?? raw.host ?? "unknown";
    const host = raw.host ?? "";
    const path = raw.path ?? "/audio";
    const ftpRoot = raw.ftpRoot ?? "/htdocs";
    const ftpLimit = raw.ftpLimit ?? 3145728;
    const ftpExt = raw.ftpExt ?? [];
    const ftpCredential = raw.ftpCredential ?? { host: "", user: "", password: "", port: 21 };
    const provider = raw.provider;

    await Hosting.findByIdAndUpdate(raw._id, {
      $set: {
        name,
        upload: {
          type: "ftp",
          ftpCredential: ftpCredential,
          ftpRoot,
          path,
          ftpLimit,
          ftpExt
        },
        stream: {
          type: "http",
          host,
          path,
          partSize: ftpLimit,
          ...(provider ? { antiHotlink: provider } : {})
        },
        ...(provider ? { provider } : {})
      },
      $unset: {
        ftpCredential: "",
        ftpRoot: "",
        ftpLimit: "",
        ftpExt: "",
        host: "",
        path: ""
      }
    });

    migrated++;
    console.log(`Migrated: ${name}`);
  }

  console.log(`\nDone. ${migrated} migrated, ${alreadyMigrated} already in new format.`);
  process.exit(0);
}

migrateHostingModel().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});

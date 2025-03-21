import * as dotenv from "dotenv";
dotenv.config();
import { parseFile } from "music-metadata";
import { Aes } from "./crypto/aes.js";

const aes = new Aes(process.env.DB_STORE_PW!);
console.log(aes.encrypt("aj2Lxpq8l74X"));

// console.log(aes.decrypt(""));
// (async () => {
//   const meta = await parseFile(
//     `D:\\Home\\Music\\Aimer\\[2023.01.01]いつのまに (feat. Aimer & 和ぬか) - MAISONdes[FLAC 96kHz 24bit]\\01. いつのまに.flac`
//   );
//   console.log(meta);
//   console.log(meta.format.trackInfo);
// })();

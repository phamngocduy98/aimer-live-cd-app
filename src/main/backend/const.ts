import * as dotenv from "dotenv";
dotenv.config();

import { AesStream } from "./crypto/aes_stream.js";

function parseEnvInt(env: string | undefined, def: number) {
  return env ? parseInt(env) : def;
}

export const PARTSIZE = parseEnvInt(process.env.PARTSIZE, 3145728);

export function getAesStream(): AesStream {
  const AES_PW = process.env.AES_PW!;
  const songAlgorithm = "aes-256-ctr";

  if (AES_PW == null) {
    throw Error(`env AES_PW not set. Try this: ${AesStream.generatePassword()}`);
  }

  return new AesStream(songAlgorithm, AES_PW);
}

import { model, Schema, Types } from "mongoose";

export enum HostingProvider {
  INFINITVE_FREE = "infinityfree.net",
  AWARD_SPACE = "awardspace.net"
}

interface IFtpCredential {
  host: string;
  user: string;
  password: string;
  port: number;
}

export interface IHosting {
  ftpCredential: IFtpCredential;
  ftpRoot: string; // /htdocs/audio
  ftpLimit: number; // bytes
  ftpExt: string[]; // ["+mp3", "-flac"]

  host: string;
  path: string;
  provider: HostingProvider;
}

const ftpCredentialSchema = new Schema<IFtpCredential>({
  host: {
    type: "String"
  },
  user: {
    type: "String"
  },
  password: {
    type: "String"
  },
  port: {
    type: "Number"
  }
});

export const hostingSchema = new Schema<IHosting>({
  ftpCredential: {
    type: ftpCredentialSchema
  },
  ftpRoot: {
    type: "String"
  },
  ftpLimit: {
    type: "Number"
  },
  ftpExt: {
    type: ["String"]
  },

  host: {
    type: "String"
  },
  path: {
    type: "String"
  },
  provider: {
    type: "String"
  }
});

export const Hosting = model("Hosting", hostingSchema, "hostings");

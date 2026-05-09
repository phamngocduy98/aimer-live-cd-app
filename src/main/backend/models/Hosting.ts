import { model, Schema } from "mongoose";

export enum HostingProvider {
  INFINITVE_FREE = "infinityfree.net",
  AWARD_SPACE = "awardspace.net"
}

export enum UploadStrategy {
  FTP = "ftp"
}

export enum StreamStrategy {
  HTTP = "http"
}

export interface IFtpCredential {
  host: string;
  user: string;
  password: string;
  port: number;
}

// Upload configs
export interface IFtpUploadConfig {
  type: UploadStrategy.FTP;
  ftpCredential: IFtpCredential;
  ftpRoot: string;
  path: string;
  ftpLimit: number;
  ftpExt: string[];
}

export type UploadConfig = IFtpUploadConfig;

// Stream configs
export interface IHttpStreamConfig {
  type: StreamStrategy.HTTP;
  host: string;
  path: string;
  partSize: number;
  antiHotlink?: HostingProvider;
}

export type StreamConfig = IHttpStreamConfig;

export interface IHosting {
  name: string;
  upload: UploadConfig;
  stream: StreamConfig;
  provider?: HostingProvider;
}

export const hostingSchema = new Schema<IHosting>({
  name: { type: String, required: true },
  upload: { type: Schema.Types.Mixed, required: true },
  stream: { type: Schema.Types.Mixed, required: true },
  provider: { type: String }
});

export const Hosting = model("Hosting", hostingSchema, "hostings");

import axios from "axios";
import { Album, AlbumDetail } from "./Album";
import { Song } from "./Song";

export interface Host {
  _id: string;
  host: string;
  provider: string;
  path?: string;
}

// Declare the electronAPI type to avoid TypeScript errors
declare global {
  interface Window {
    electronAPI: {
      getPort: () => Promise<number>;
      submitPassword: (password: string) => void;
    };
  }
}

export class AppAPI {
  // public static HOST = process.env.NODE_ENV === "production" ? "/api" : "http://localhost:3000/api";
  public static HOST = "http://localhost:3001/api";
  constructor() {
    window.electronAPI.getPort().then((port) => {
      console.log("Port:", port);
      AppAPI.HOST = `http://localhost:${port}/api`;
      axios.defaults.baseURL = AppAPI.HOST;
    });
  }

  async listAlbums(page: number = 0, pageSize: number = 30): Promise<Album[]> {
    const resp = await axios.get<Album[]>("/albums", {
      params: {
        page,
        pageSize
      }
    });
    return resp.data;
  }

  async album(id: string): Promise<AlbumDetail> {
    const resp = await axios.get<AlbumDetail>("/album/" + id);
    return resp.data;
  }
  async song(id: string): Promise<Song> {
    const resp = await axios.get<Song>("/song/" + id);
    return resp.data;
  }
  async artistTopTracks(name: string): Promise<Song[]> {
    const resp = await axios.get<Song[]>("/artist/" + name + "/top-tracks");
    return resp.data;
  }

  async getHosts(): Promise<Host[]> {
    const resp = await axios.get<Host[]>("/hosts");
    return resp.data;
  }

  async deleteHost(id: string): Promise<void> {
    await axios.delete(`/hosts/${id}`);
  }

  async pingHost(hostId: string): Promise<{
    available: boolean;
    files: { fileName: string; parts: string; title: string; fileCount: number }[];
    status?: number;
  }> {
    const resp = await axios.get<{
      available: boolean;
      files: { fileName: string; parts: string; title: string; fileCount: number }[];
      status?: number;
    }>(`/hosts/${hostId}/ping`);
    return resp.data;
  }

async createHost(data: {
  host: string;
  provider: string;
  path?: string;
  ftpCredential: {
    host: string;
    port?: number;
    username: string;
    password: string;
    secure?: boolean;
  };
  ftpRoot: string;
}): Promise<string> {
    const resp = await axios.post<string>("/hosts", data);
    return resp.data;
  }
}

export const appAPI = new AppAPI();

import axios from "axios";
import { Album, AlbumDetail } from "./Album";
import { Song } from "./Song";
import { Video } from "./Video";
import { Playlist, PlaylistDetail } from "./Playlist";

export interface Host {
  _id: string;
  name: string;
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

  async listSongs(page: number = 0, pageSize: number = 50): Promise<Song[]> {
    const resp = await axios.get<Song[]>("/songs", {
      params: {
        page,
        pageSize
      }
    });
    return resp.data;
  }

  async listVideos(page: number = 0, pageSize: number = 50): Promise<Video[]> {
    const resp = await axios.get<Video[]>("/videos", {
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

  async search(q: string): Promise<SearchResult> {
    const resp = await axios.get<SearchResult>("/search", {
      params: { q }
    });
    return resp.data;
  }

  async getHosts(): Promise<Host[]> {
    const resp = await axios.get<Host[]>("/hosts");
    return resp.data;
  }

  async deleteHost(id: string): Promise<void> {
    await axios.delete(`/hosts/${id}`);
  }

  async listHostFiles(hostId: string): Promise<{
    available: boolean;
    files: { fileName: string; parts: string; title: string; fileCount: number }[];
    status?: number;
  }> {
    const resp = await axios.get<{
      available: boolean;
      files: { fileName: string; parts: string; title: string; fileCount: number }[];
      status?: number;
    }>(`/hosts/${hostId}/files`);
    return resp.data;
  }

  async listPlaylists(): Promise<Playlist[]> {
    const resp = await axios.get<Playlist[]>("/playlists");
    return resp.data;
  }

  async createPlaylist(data: { name: string; description?: string }): Promise<string> {
    const resp = await axios.post<string>("/playlists", data);
    return resp.data;
  }

  async getPlaylist(id: string): Promise<PlaylistDetail> {
    const resp = await axios.get<PlaylistDetail>("/playlist/" + id);
    return resp.data;
  }

  async updatePlaylist(id: string, data: { name?: string; description?: string }): Promise<void> {
    await axios.put("/playlist/" + id, data);
  }

  async deletePlaylist(id: string): Promise<void> {
    await axios.delete("/playlist/" + id);
  }

  async addSongsToPlaylist(playlistId: string, songIds: string[]): Promise<string> {
    const resp = await axios.post<string>("/playlist/" + playlistId + "/songs", { songIds });
    return resp.data;
  }

  async removeSongFromPlaylist(playlistId: string, songId: string): Promise<void> {
    await axios.delete(`/playlist/${playlistId}/songs/${songId}`);
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

export interface SearchResult {
  songs: Song[];
  albums: Album[];
  videos: Video[];
}

export const appAPI = new AppAPI();

import {
  CreateInfo,
  CreationDateInfo,
  DeleteInfo,
  Errors,
  FileSystem,
  FileSystemSerializer,
  ILockManager,
  IPropertyManager,
  LastModifiedDateInfo,
  LocalLockManager,
  LocalPropertyManager,
  LockManagerInfo,
  MoveInfo,
  OpenReadStreamInfo,
  OpenWriteStreamInfo,
  Path,
  PropertyManagerInfo,
  ReadDirInfo,
  ResourceType,
  ReturnCallback,
  SimpleCallback,
  SizeInfo,
  TypeInfo
} from "webdav-server/lib/index.v2.js";

import { PassThrough, Readable, Writable } from "stream";
import { Album } from "../db/Album.js";
import { Format, ISong, Song } from "../db/Song.js";
import { WithId } from "mongodb";
import { SongStream } from "../stream/SongStream.js";

export class StreamFileSystemResource {
  props: LocalPropertyManager;
  locks: LocalLockManager;
  type: ResourceType = ResourceType.NoResource;

  constructor(data?: StreamFileSystemResource) {
    if (!data) {
      this.props = new LocalPropertyManager();
      this.locks = new LocalLockManager();
    } else {
      const rs = data as StreamFileSystemResource;
      this.props = new LocalPropertyManager(rs.props);
      this.locks = new LocalLockManager();
    }
  }
}

export class StreamFSSerializer implements FileSystemSerializer {
  uid(): string {
    return "StreamFSSerializer-1.0.0";
  }

  serialize(fs: StreamFileSystem, callback: ReturnCallback<any>): void {
    callback(null as any, {
      resources: fs.resources,
      config: fs.config
    });
  }

  unserialize(serializedData: any, callback: ReturnCallback<FileSystem>): void {
    const fs = new StreamFileSystem(serializedData.config);
    fs.resources = serializedData.resources;
    callback(null as any, fs);
  }
}

// export const StreamFSSerializerVersions = {
//   versions: {
//     "1.0.0": StreamFSSerializer,
//   },
//   instances: [new StreamFSSerializer()] as FileSystemSerializer[],
// };

export class StreamFileSystem extends FileSystem {
  resources: {
    [path: string]: StreamFileSystemResource;
  };

  constructor(public config: string) {
    super(new StreamFSSerializer());
    this.resources = {
      "/": new StreamFileSystemResource()
    };
  }

  isValidId(id: string | null) {
    return id == null || id.length === 12 || id.length === 24;
  }
  protected getRealPath(path: Path) {
    const sPath = path.toString();
    const [albumName, albumId] = (path.paths[0] ?? "").split(".");
    const [songNo, songName, songId, songExt] = (path.paths[1] ?? "").split(".");

    return {
      songNo,
      albumName,
      albumId,
      songName,
      songId,
      songExt,
      resource: this.resources[sPath]
    };
  }

  protected _create(path: Path, ctx: CreateInfo, _callback: SimpleCallback): void {
    console.log("[CREATE]");
    // const { realPath } = this.getRealPath(path);

    // const callback = (e: any) => {
    //   if (!e) this.resources[path.toString()] = new StreamFileSystemResource();
    //   else if (e) e = Errors.ResourceAlreadyExists;

    //   _callback(e);
    // };

    // if (ctx.type.isDirectory) fs.mkdir(realPath, callback);
    // else {
    //   if (!fs.constants || !fs.constants.O_CREAT) {
    //     // node v5.* and lower
    //     fs.writeFile(realPath, Buffer.alloc(0), callback);
    //   } else {
    //     // node v6.* and higher
    //     fs.open(realPath, fs.constants.O_CREAT, (e, fd) => {
    //       if (e) return callback(e);
    //       fs.close(fd, callback);
    //     });
    //   }
    // }
  }

  protected _delete(path: Path, ctx: DeleteInfo, _callback: SimpleCallback): void {
    console.log("[DELETE]");
    // const { realPath } = this.getRealPath(path);

    // const callback = (e: any) => {
    //   if (!e) delete this.resources[path.toString()];
    //   _callback(e);
    // };

    // this.type(ctx.context, path, (e, type) => {
    //   if (e) return callback(Errors.ResourceNotFound);

    //   if (type?.isDirectory) {
    //     if (ctx.depth === 0) return fs.rmdir(realPath, callback);

    //     this.readDir(ctx.context, path, (e, files) => {
    //       let nb = files!.length + 1;
    //       const done = (e?: Error) => {
    //         if (nb < 0) return;

    //         if (e) {
    //           nb = -1;
    //           return callback(e);
    //         }

    //         if (--nb === 0) fs.rmdir(realPath, callback);
    //       };

    //       files!.forEach((file) =>
    //         this.delete(
    //           ctx.context,
    //           path.getChildPath(file),
    //           ctx.depth === -1 ? -1 : ctx.depth - 1,
    //           done
    //         )
    //       );
    //       done();
    //     });
    //   } else fs.unlink(realPath, callback);
    // });
  }

  protected _openWriteStream(
    path: Path,
    ctx: OpenWriteStreamInfo,
    callback: ReturnCallback<Writable>
  ): void {
    console.log("[WRITE]");
    // const { realPath, resource } = this.getRealPath(path);

    // fs.open(realPath, "w+", (e, fd) => {
    //   if (e) return callback(Errors.ResourceNotFound);

    //   if (!resource)
    //     this.resources[path.toString()] = new StreamFileSystemResource();

    //   callback(null as any, fs.createWriteStream(null as any, { fd }));
    // });
  }

  protected _openReadStream(
    path: Path,
    ctx: OpenReadStreamInfo,
    callback: ReturnCallback<Readable>
  ): void {
    const { songId } = this.getRealPath(path);
    console.log("[READ]", songId, this.isValidId(songId));
    if (!this.isValidId(songId)) {
      return callback(Errors.ResourceNotFound);
    }

    (async () => {
      try {
        const song = await Song.findById(songId).populate("hostingList").exec();

        if (song == null) {
          console.log("[READ] Not found");
          return callback(Errors.ResourceNotFound);
        }
        const outStream = new PassThrough();

        const stream = new SongStream({});
        stream.stream(song, outStream);

        return callback(undefined, outStream);
      } catch (e) {
        console.log("[READ] Stream die", e);
        return callback(Errors.Forbidden);
      }
    })();
  }

  protected _move(
    pathFrom: Path,
    pathTo: Path,
    ctx: MoveInfo,
    callback: ReturnCallback<boolean>
  ): void {
    console.log("[MOVE]");
    // const { realPath: realPathFrom } = this.getRealPath(pathFrom);
    // const { realPath: realPathTo } = this.getRealPath(pathTo);
    // const rename = (overwritten: boolean) => {
    //   fs.rename(realPathFrom, realPathTo, (e) => {
    //     if (e) return callback(e);
    //     this.resources[realPathTo] = this.resources[realPathFrom];
    //     delete this.resources[realPathFrom];
    //     callback(null as any, overwritten);
    //   });
    // };
    // fs.access(realPathTo, (e) => {
    //   if (e) {
    //     // destination doesn't exist
    //     rename(false);
    //   } else {
    //     // destination exists
    //     if (!ctx.overwrite) return callback(Errors.ResourceAlreadyExists);
    //     this.delete(ctx.context, pathTo, (e) => {
    //       if (e) return callback(e);
    //       rename(true);
    //     });
    //   }
    // });
  }

  async getSongInfo(songId: string) {
    return Song.findById(songId);
  }

  protected _size(path: Path, ctx: SizeInfo, callback: ReturnCallback<number>): void {
    const { albumId, songId } = this.getRealPath(path);
    // console.log("SIZE", path.toString());

    (async () => {
      if (albumId == null || songId == null || !this.isValidId(songId)) {
        return callback(Errors.ResourceNotFound);
      }
      // root/album_name (album browser)
      const song = await this.getSongInfo(songId);
      //   console.log("[SONG]", song);
      if (song == null) {
        return callback(Errors.ResourceNotFound);
      }
      callback(undefined, song.size);
    })();
  }

  /**
   * Get a property of an existing resource (object property, not WebDAV property). If the resource doesn't exist, it is created.
   *
   * @param path Path of the resource
   * @param ctx Context of the method
   * @param propertyName Name of the property to get from the resource
   * @param callback Callback returning the property object of the resource
   */
  protected getPropertyFromResource(
    path: Path,
    ctx: any,
    propertyName: string,
    callback: ReturnCallback<any>
  ): void {
    let resource = this.resources[path.toString()];
    if (!resource) {
      resource = new StreamFileSystemResource();
      this.resources[path.toString()] = resource;
    }

    callback(null as any, resource[propertyName as keyof StreamFileSystemResource]);
  }

  protected _lockManager(
    path: Path,
    ctx: LockManagerInfo,
    callback: ReturnCallback<ILockManager>
  ): void {
    this.getPropertyFromResource(path, ctx, "locks", callback);
  }

  protected _propertyManager(
    path: Path,
    ctx: PropertyManagerInfo,
    callback: ReturnCallback<IPropertyManager>
  ): void {
    this.getPropertyFromResource(path, ctx, "props", callback);
  }

  fileName(name: string) {
    return name.replace(/\//g, "-");
  }

  async listAlbums() {
    const albums = await Album.find(
      {},
      {
        title: 1,
        artist: 1
      }
    )
      // .skip(page)
      .limit(10)
      .lean()
      .exec();
    return albums.map((al) => `${this.fileName(al.title)}.${al._id}`);
  }

  songFormatExt(format: Format) {
    if (format === "FLAC") return "flac";
    return "mp3";
  }

  async listAlbumTracks(albumId: string) {
    // console.log("[TRACKS]", albumId);
    const album = await Album.findById(albumId, {
      trackList: 1
    })
      .populate("trackList", {
        hostingList: 0,
        iv: 0,
        album: 0,
        fileList: 0
      })
      .lean()
      .exec();
    if (album == null) throw Error("Not found");
    return album.trackList.map(
      (track) =>
        `${track.trackNo}. ${this.fileName(track.title)}.${
          (track as WithId<ISong>)._id
        }.${this.songFormatExt(track.format)}`
    );
  }

  protected _readDir(
    path: Path,
    ctx: ReadDirInfo,
    callback: ReturnCallback<string[] | Path[]>
  ): void {
    const { albumId } = this.getRealPath(path);
    (async () => {
      if (albumId == null) {
        // root (albums list)
        try {
          const albums = await this.listAlbums();
          //   console.log("[ALBUMS]", albums);
          callback(undefined, albums);
        } catch (e) {
          callback(Errors.ResourceNotFound);
        }
      } else {
        // root/album_name (album browser)
        try {
          const tracks = await this.listAlbumTracks(albumId);
          //   console.log("[TRACKS]", tracks);
          callback(undefined, tracks);
        } catch (e) {
          callback(Errors.ResourceNotFound);
        }
      }
    })();
  }

  protected _creationDate(
    path: Path,
    ctx: CreationDateInfo,
    callback: ReturnCallback<number>
  ): void {
    callback(undefined, 1);
  }

  protected _lastModifiedDate(
    path: Path,
    ctx: LastModifiedDateInfo,
    callback: ReturnCallback<number>
  ): void {
    callback(undefined, 1);
  }

  protected _type(path: Path, ctx: TypeInfo, callback: ReturnCallback<ResourceType>): void {
    // console.log("TYPE", path.toString());
    const { albumId, songId } = this.getRealPath(path);
    if (albumId == null) {
      // root/
      return callback(undefined, ResourceType.Directory);
    }
    if (songId == null) {
      // root/album_name
      return callback(undefined, ResourceType.Directory);
    }
    // root/album_name/song_name
    return callback(undefined, ResourceType.File);
  }
}

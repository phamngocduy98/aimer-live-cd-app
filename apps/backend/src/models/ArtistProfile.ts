import { model, Schema } from "mongoose";

export interface IArtistProfile {
  name: string;
  image?: Buffer;
  imageMimeType?: string;
}

export const artistProfileSchema = new Schema<IArtistProfile>({
  name: { type: String, required: true, unique: true, index: true },
  image: { type: Buffer },
  imageMimeType: { type: String }
});

export const ArtistProfile = model("ArtistProfile", artistProfileSchema, "artist_profiles");

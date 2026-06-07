import { apiAssetUrl } from "@lib/axios";

export function getPrimaryArtist(artist?: string[] | string | null): string {
  if (Array.isArray(artist)) return artist[0] ?? "Unknown";
  return artist || "Unknown";
}

export function formatArtists(artist?: string[] | string | null): string {
  if (Array.isArray(artist)) return artist.length > 0 ? artist.join(", ") : "Unknown";
  return artist || "Unknown";
}

export function artistPath(name: string): string {
  return `/artist/${encodeURIComponent(name)}`;
}

export function artistImageUrl(name: string): string {
  return apiAssetUrl(`/artist/${encodeURIComponent(name)}/image`);
}

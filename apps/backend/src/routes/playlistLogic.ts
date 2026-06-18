export interface PlaylistItemLike {
  mediaType: "audio" | "video";
  mediaId: { toString(): string } | string;
}

export function findDuplicatePlaylistItems(
  existingItems: PlaylistItemLike[],
  newItems: PlaylistItemLike[]
): string[] {
  const seen = new Set(existingItems.map((item) => `${item.mediaType}:${item.mediaId.toString()}`));
  const duplicates: string[] = [];
  for (const item of newItems) {
    const key = `${item.mediaType}:${item.mediaId.toString()}`;
    if (seen.has(key)) duplicates.push(key);
    seen.add(key);
  }
  return duplicates;
}

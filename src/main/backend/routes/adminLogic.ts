export interface ListedHostFile {
  fileName: string;
  partNumbers: number[];
}

export interface HostFileListing {
  hostId: string;
  hostName: string;
  available: boolean;
  files: ListedHostFile[];
}

export interface MediaLookup {
  id: string;
  title: string;
  type: "song" | "video" | "unknown";
  fileCount: number;
}

export interface AdminUploadRow {
  id: string;
  name: string;
  type: "song" | "video" | "unknown";
  healthy: boolean;
  health: "healthy" | "missing-parts" | "unknown";
  ha: number;
  fileCount: number;
  missingParts: number[];
  hosts: { id: string; name: string; parts: number[] }[];
}

export function normalizeProviderPartNumbers(files: ListedHostFile[]): ListedHostFile[] {
  return files.map((file) => ({
    ...file,
    partNumbers: file.partNumbers
      .map((part) => part - 1)
      .filter((part) => Number.isInteger(part) && part >= 0)
  }));
}

export function getPartFileNames(id: string, fileCount: number, fileExtension: string): string[] {
  return Array.from({ length: Math.max(0, fileCount) }, (_value, index) => {
    const suffix = index === 0 ? "" : `_${index}`;
    return `${id}${suffix}.${fileExtension}`;
  });
}

export function buildUploadRows(
  listings: HostFileListing[],
  mediaLookup: Map<string, MediaLookup>
): AdminUploadRow[] {
  const filesByMedia = new Map<
    string,
    { hostId: string; hostName: string; partNumbers: number[] }[]
  >();

  for (const listing of listings) {
    if (!listing.available) continue;
    for (const file of listing.files) {
      if (!filesByMedia.has(file.fileName)) filesByMedia.set(file.fileName, []);
      filesByMedia.get(file.fileName)!.push({
        hostId: listing.hostId,
        hostName: listing.hostName,
        partNumbers: file.partNumbers
      });
    }
  }

  return Array.from(filesByMedia.entries())
    .map(([id, hostFiles]) => {
      const media = mediaLookup.get(id);
      const partSet = new Set<number>();
      hostFiles.forEach((hostFile) => hostFile.partNumbers.forEach((part) => partSet.add(part)));
      const expectedCount = media?.fileCount ?? 0;
      const missingParts =
        expectedCount > 0
          ? Array.from({ length: expectedCount }, (_value, index) => index).filter(
              (part) => !partSet.has(part)
            )
          : [];
      const healthy = Boolean(media && expectedCount > 0 && missingParts.length === 0);

      return {
        id,
        name: media?.title ?? "Unknown",
        type: media?.type ?? "unknown",
        healthy,
        health: media ? (healthy ? "healthy" : "missing-parts") : "unknown",
        ha: hostFiles.filter((hostFile) => hostFile.partNumbers.length > 0).length,
        fileCount: media?.fileCount ?? 0,
        missingParts,
        hosts: hostFiles
          .filter((hostFile) => hostFile.partNumbers.length > 0)
          .map((hostFile) => ({
            id: hostFile.hostId,
            name: hostFile.hostName,
            parts: hostFile.partNumbers
          }))
      } satisfies AdminUploadRow;
    })
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function mergeArtistNames(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return Array.from(
    new Set(
      values
        .map((value) => (typeof value === "string" ? value.trim() : ""))
        .filter((value) => value.length > 0)
    )
  );
}

export interface NaturalVideoSize {
  sourceKey: string;
  width: number;
  height: number;
}

export function resolveVideoSize(
  sourceKey: string,
  naturalSize: NaturalVideoSize | null,
  metadataWidth?: number,
  metadataHeight?: number
) {
  const currentNaturalSize = naturalSize?.sourceKey === sourceKey ? naturalSize : null;

  return {
    width: Math.max(currentNaturalSize?.width || metadataWidth || 16, 1),
    height: Math.max(currentNaturalSize?.height || metadataHeight || 9, 1)
  };
}

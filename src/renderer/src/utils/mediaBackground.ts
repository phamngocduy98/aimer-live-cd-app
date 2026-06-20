import React from "react";
import type { Song, Video } from "@features/library";
import { mediaArtworkUrl } from "@utils/mediaArtwork";

const MEDIA_BACKGROUND_PALETTE = [
  "#96391f",
  "#7f292d",
  "#71375f",
  "#4d3f78",
  "#315a72",
  "#24605d",
  "#3f6438",
  "#75502d"
] as const;

export function useMediaBackgroundColor(media?: Song | Video | null): string {
  const [color, setColor] = React.useState<string>(MEDIA_BACKGROUND_PALETTE[0]);

  React.useEffect(() => {
    const artworkUrl = mediaArtworkUrl(media);
    if (!artworkUrl) {
      setColor(MEDIA_BACKGROUND_PALETTE[0]);
      return;
    }
    void getMediaBackgroundColor(artworkUrl).then(setColor);
  }, [media]);

  return color;
}

async function getMediaBackgroundColor(imageUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = imageUrl;
    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) return resolve(MEDIA_BACKGROUND_PALETTE[0]);
        canvas.width = 24;
        canvas.height = 24;
        context.drawImage(image, 0, 0, 24, 24);
        const pixels = context.getImageData(0, 0, 24, 24).data;
        let best = { r: 150, g: 57, b: 31, score: -1 };

        for (let index = 0; index < pixels.length; index += 4) {
          const r = pixels[index];
          const g = pixels[index + 1];
          const b = pixels[index + 2];
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const saturation = max === 0 ? 0 : (max - min) / max;
          const brightness = max / 255;
          const score = saturation * 1.6 + brightness * 0.35;
          if (saturation > 0.28 && brightness > 0.18 && score > best.score) {
            best = { r, g, b, score };
          }
        }

        resolve(
          MEDIA_BACKGROUND_PALETTE.reduce(
            (closest, paletteColor) => {
              const [r, g, b] = hexToRgb(paletteColor);
              const distance = Math.hypot(best.r - r, best.g - g, best.b - b);
              return distance < closest.distance ? { color: paletteColor, distance } : closest;
            },
            { color: MEDIA_BACKGROUND_PALETTE[0] as string, distance: Number.POSITIVE_INFINITY }
          ).color
        );
      } catch {
        resolve(MEDIA_BACKGROUND_PALETTE[0]);
      }
    };
    image.onerror = () => resolve(MEDIA_BACKGROUND_PALETTE[0]);
  });
}

function hexToRgb(color: string): [number, number, number] {
  return [
    Number.parseInt(color.slice(1, 3), 16),
    Number.parseInt(color.slice(3, 5), 16),
    Number.parseInt(color.slice(5, 7), 16)
  ];
}

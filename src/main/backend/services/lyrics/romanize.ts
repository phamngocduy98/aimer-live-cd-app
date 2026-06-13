import type { ILyricCue } from "../../models/Lyrics.js";

let converterPromise: Promise<any> | null = null;

async function getConverter(): Promise<any> {
  if (!converterPromise) {
    converterPromise = (async () => {
      const [kuroshiroMod, { default: KuromojiAnalyzer }] = await Promise.all([
        import("kuroshiro"),
        import("kuroshiro-analyzer-kuromoji")
      ]);
      const Kuroshiro = kuroshiroMod.default?.default || kuroshiroMod.default;
      const converter = new Kuroshiro();
      await converter.init(new KuromojiAnalyzer());
      return converter;
    })();
  }
  return converterPromise;
}

export async function romanizeCues(cues: ILyricCue[]): Promise<ILyricCue[]> {
  if (process.env.E2E_TEST_MODE === "true") {
    return cues.map((cue, index) => ({ ...cue, text: `romaji preview ${index + 1}` }));
  }
  const converter = await getConverter();
  const converted: ILyricCue[] = [];
  for (const cue of cues) {
    const text = String(
      await converter.convert(cue.text, {
        to: "romaji",
        mode: "spaced",
        romajiSystem: "hepburn"
      })
    )
      .replace(/\s+/g, " ")
      .replace(/\s+([、。！？,.!?'ʼ])/g, "$1")
      .replace(/(['ʼ])\s+/g, "$1")
      .trim();
    converted.push({ ...cue, text });
  }
  return converted;
}

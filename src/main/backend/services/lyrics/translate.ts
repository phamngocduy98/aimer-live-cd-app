import type { ILyricCue } from "../../models/Lyrics.js";

export type TranslationProvider = "mymemory" | "libretranslate";
export type TranslationTarget = "en" | "vi";

export function availableTranslationProviders(): TranslationProvider[] {
  return process.env.LIBRETRANSLATE_URL ? ["mymemory", "libretranslate"] : ["mymemory"];
}

async function translateMyMemory(text: string, target: TranslationTarget): Promise<string> {
  const url = new URL("https://api.mymemory.translated.net/get");
  url.searchParams.set("q", text);
  url.searchParams.set("langpair", `ja|${target}`);
  if (process.env.MYMEMORY_EMAIL) url.searchParams.set("de", process.env.MYMEMORY_EMAIL);
  const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (response.status === 429) throw new Error("MyMemory rate limit reached");
  if (!response.ok) throw new Error(`MyMemory request failed with status ${response.status}`);
  const data = (await response.json()) as any;
  const translated = data?.responseData?.translatedText;
  if (typeof translated !== "string" || !translated.trim()) {
    throw new Error("MyMemory returned an empty translation");
  }
  return translated.trim();
}

async function translateLibre(texts: string[], target: TranslationTarget): Promise<string[]> {
  const base = process.env.LIBRETRANSLATE_URL;
  if (!base) throw new Error("LibreTranslate is not configured");
  const response = await fetch(new URL("/translate", base), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(20_000),
    body: JSON.stringify({
      q: texts,
      source: "ja",
      target,
      format: "text",
      ...(process.env.LIBRETRANSLATE_API_KEY ? { api_key: process.env.LIBRETRANSLATE_API_KEY } : {})
    })
  });
  if (response.status === 429) throw new Error("LibreTranslate rate limit reached");
  if (!response.ok) throw new Error(`LibreTranslate request failed with status ${response.status}`);
  const data = (await response.json()) as any;
  const translated = data?.translatedText;
  if (!Array.isArray(translated) || translated.length !== texts.length) {
    throw new Error("LibreTranslate returned an invalid batch response");
  }
  return translated.map((text) => String(text).trim());
}

export async function translateCues(
  cues: ILyricCue[],
  target: TranslationTarget,
  provider: TranslationProvider
): Promise<ILyricCue[]> {
  if (!availableTranslationProviders().includes(provider)) {
    throw new Error(`${provider} translation is not configured`);
  }
  if (process.env.E2E_TEST_MODE === "true") {
    return cues.map((cue, index) => ({
      ...cue,
      text: target === "en" ? `English preview ${index + 1}` : `Bản dịch ${index + 1}`
    }));
  }
  if (cues.reduce((total, cue) => total + cue.text.length, 0) > 20_000) {
    throw new Error("Translation request exceeds 20,000 characters");
  }
  if (provider === "mymemory" && cues.some((cue) => cue.text.length > 500)) {
    throw new Error("MyMemory supports at most 500 characters per cue");
  }

  let texts: string[];
  if (provider === "libretranslate") {
    texts = await translateLibre(
      cues.map((cue) => cue.text),
      target
    );
  } else {
    texts = [];
    for (let index = 0; index < cues.length; index += 1) {
      try {
        texts.push(await translateMyMemory(cues[index].text, target));
      } catch (error) {
        throw new Error(
          `Translation failed at cue ${index + 1}: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }
  }
  return cues.map((cue, index) => ({ ...cue, text: texts[index] }));
}

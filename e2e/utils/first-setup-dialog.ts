import { type Page } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config();

const CONFIG_FIELDS = [
  "MONGO_DB_HOST",
  "MONGO_DB_USER",
  "MONGO_DB_PW",
  "AES_PW",
  "DB_STORE_PW",
] as const;

export async function fillFormWithEnvInfoAndSubmit(page: Page): Promise<void> {
  for (const field of CONFIG_FIELDS) {
    await page.fill(`#${field}`, process.env[field] ?? "");
  }
  await page.click("button[type='submit']");
}

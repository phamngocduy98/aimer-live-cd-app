import { type Page, _electron as electron } from "@playwright/test";

export type ElectronApp = Awaited<ReturnType<typeof electron.launch>>;

export interface ElectronTestContext {
  electronApp: ElectronApp;
  mainWindow: Page;
}

export interface LaunchOptions {
  windowTimeout?: number;
  windowSize?: [number, number];
}

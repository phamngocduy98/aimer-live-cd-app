import { app, shell, BrowserWindow, ipcMain, dialog, safeStorage } from "electron";
import { join } from "path";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";
import icon from "../../resources/icon.png?asset";
import Store from "electron-store";
import { createLogger, getRootLogger, initLogger } from "./utils/log.js";
import { startDirectStreamServer } from "./direct-stream-server.js";

let isInitializing = true;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let log: any = { info: () => {}, error: () => {} };
let directStreamBaseUrl: string | null = null;
let stopDirectStreamServer: (() => Promise<void>) | null = null;

// Định nghĩa interface cho cấu hình
interface AppConfig {
  AES_PW?: string;
}
// Khởi tạo store - sử dụng any tạm thời để tránh lỗi TypeScript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const store = new Store<{ config: AppConfig }>() as any;

// Hàm mã hóa dữ liệu nhạy cảm
function encryptValue(value: string): string {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error("Encryption is not available on this system");
  }
  const buffer = safeStorage.encryptString(value);
  return buffer.toString("hex");
}

// Hàm giải mã dữ liệu nhạy cảm
function decryptValue(encryptedValue: string): string {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error("Encryption is not available on this system");
  }
  const buffer = Buffer.from(encryptedValue, "hex");
  return safeStorage.decryptString(buffer);
}

function getEncryptedConfig(): Record<string, string> {
  return (store.get("config") as Record<string, string>) || {};
}

function getApiBaseUrl(): string {
  return (
    process.env.API_BASE_URL ||
    process.env.VITE_API_BASE_URL ||
    (is.dev ? "http://localhost:3001/api" : "https://aimer.btxa.io.vn/api")
  );
}

function getStreamBaseUrl(): string {
  return process.env.STREAM_BASE_URL || process.env.VITE_STREAM_BASE_URL || getApiBaseUrl();
}

function storeAesPassword(password: string): void {
  if (!password.trim()) {
    throw new Error("AES password is required");
  }
  const config = getEncryptedConfig();
  config.AES_PW = encryptValue(password);
  store.set("config", config);
  process.env.AES_PW = password;
}

function hasStoredAesPassword(): boolean {
  return Boolean(getEncryptedConfig().AES_PW);
}

function loadStoredAesPassword(): void {
  const encrypted = getEncryptedConfig().AES_PW;
  if (encrypted) {
    process.env.AES_PW = decryptValue(encrypted);
  }
}

function clearStoredAesPassword(): void {
  const config = getEncryptedConfig();
  delete config.AES_PW;
  store.set("config", config);
  delete process.env.AES_PW;
}

async function initializeApp(): Promise<void> {
  initLogger({ logDir: join(app.getPath("userData"), "logs"), pretty: is.dev });
  log = createLogger("Main");

  try {
    loadStoredAesPassword();
  } catch (error: unknown) {
    log.error({ err: error }, "Failed to load encrypted app configuration");
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    dialog.showErrorBox("Error", `Failed to load app configuration: ${errorMessage}`);
    app.quit();
    return;
  }

  // Set app user model id for windows
  electronApp.setAppUserModelId("vn.io.btxa.music.aimer");

  try {
    const directStreamServer = await startDirectStreamServer(getApiBaseUrl());
    directStreamBaseUrl = directStreamServer.baseUrl;
    stopDirectStreamServer = directStreamServer.close;
    log.info({ directStreamBaseUrl }, "Direct stream server started");
  } catch (error) {
    log.error({ err: error }, "Failed to start direct stream server");
  }

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  ipcMain.handle("get-api-base-url", () => getApiBaseUrl());
  ipcMain.handle("get-stream-base-url", () => getStreamBaseUrl());
  ipcMain.handle("get-direct-stream-base-url", () => directStreamBaseUrl);
  ipcMain.handle("store-aes-password", (_event, password: string) => storeAesPassword(password));
  ipcMain.handle("has-stored-aes-password", () => hasStoredAesPassword());
  ipcMain.handle("clear-stored-aes-password", () => clearStoredAesPassword());
  createWindow();
  isInitializing = false;

  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
}

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    useContentSize: true,
    ...(process.platform === "linux" ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, "../preload/index.cjs"),
      sandbox: false,
      webSecurity: true,
      contextIsolation: true
    }
  });

  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
    if (is.dev && !process.env.DISABLE_DEVTOOLS) {
      mainWindow.webContents.openDevTools();
    }
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(`${process.env["ELECTRON_RENDERER_URL"]}`);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

async function gracefulShutdown(): Promise<void> {
  if (stopDirectStreamServer) {
    try {
      await stopDirectStreamServer();
      stopDirectStreamServer = null;
    } catch (err) {
      console.error("Failed to stop direct stream server:", err);
    }
  }
  try {
    getRootLogger().flush();
    log.info("Logger flushed");
  } catch (err) {
    console.error("Failed to flush logger:", err);
  }
}

app.on("before-quit", (event) => {
  event.preventDefault();
  gracefulShutdown().finally(() => {
    app.exit();
  });
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(initializeApp);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin" && !isInitializing) {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

import { app, shell, BrowserWindow, ipcMain, dialog, safeStorage } from "electron";
import { join } from "path";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";
import icon from "../../resources/icon.png?asset";
import getPort from "get-port";
import { startServer } from "./backend/index.js";
import Store from "electron-store";

// Định nghĩa interface cho cấu hình
interface AppConfig {
  MONGO_DB_HOST?: string;
  MONGO_DB_USER?: string;
  MONGO_DB_PW?: string;
  AES_PW?: string;
  DB_STORE_PW?: string;
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

function createPasswordWindow(): Promise<AppConfig | null> {
  return new Promise((resolve) => {
    const passwordWindow = new BrowserWindow({
      width: 360,
      height: 450,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: join(__dirname, "../preload/index.cjs")
      },
      resizable: false,
      minimizable: false,
      maximizable: false,
      parent: BrowserWindow.getFocusedWindow() || undefined,
      modal: true,
      autoHideMenuBar: true,
      useContentSize: true
    });

    // if (is.dev) {
    //   passwordWindow.webContents.openDevTools();
    // }

    // Load password input HTML
    if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
      passwordWindow.loadURL(`${process.env["ELECTRON_RENDERER_URL"]}/password.html`);
    } else {
      passwordWindow.loadFile(join(__dirname, "../renderer/password.html"));
    }

    // Handle password submission
    ipcMain.once("submit-password", (_, configData: string) => {
      try {
        const config = JSON.parse(configData);
        console.log("Received configuration:", config);
        resolve(config);
        passwordWindow.close();
      } catch (error) {
        console.error("Error parsing configuration:", error);
        resolve(null);
        passwordWindow.close();
      }
    });

    // Handle window close
    passwordWindow.on("closed", () => {
      resolve(null);
    });
  });
}

async function initializeApp(): Promise<void> {
  const port = await getPort({ port: 3000 });

  // Check if configuration exists
  const hasConfig = store.get("config") !== undefined;
  if (!hasConfig) {
    // If not, display configuration window
    const config = await createPasswordWindow();
    if (config) {
      try {
        // Set environment variables
        Object.entries(config).forEach(([key, value]) => {
          if (typeof value === "string") {
            process.env[key] = value;
          }
        });

        // Encrypt sensitive data
        const encryptedData: Record<string, string> = {};
        for (const [key, value] of Object.entries(config)) {
          encryptedData[key] = encryptValue(value);
        }

        // Save configuration
        store.set("config", encryptedData);
      } catch (error) {
        console.error("Error processing configuration:", error);
        await dialog.showErrorBox("Error", "Unable to save configuration. Please try again.");
        app.quit();
        return;
      }
    } else {
      // User canceled
      app.quit();
      return;
    }
  } else {
    console.log("Configuration exists, loading from store");
    // Load existing configuration from store
    const config = (store.get("config") as Record<string, string>) || {};

    // Set environment variables for public data
    const decryptedConfig: Record<string, string> = {};
    for (const [key, value] of Object.entries(config)) {
      if (value) {
        decryptedConfig[key] = decryptValue(value);
      }
    }
    console.log("Configuration decrypted successfully");
    Object.assign(process.env, decryptedConfig);
    console.log("Configuration assigned to process.env");
  }

  try {
    await startServer(port);
  } catch (error: unknown) {
    console.error("Failed to start server", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    dialog.showErrorBox("Error", `Failed to start server: ${errorMessage}`);
    app.quit();
    return;
  }

  // Set app user model id for windows
  electronApp.setAppUserModelId("vn.io.btxa.music");

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  // create handle for get port
  ipcMain.handle("get-port", () => port);
  createWindow();

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
    ...(process.platform === "linux" ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, "../preload/index.cjs"),
      sandbox: false,
      webSecurity: true,
      contextIsolation: true
    }
  });

  if (is.dev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(initializeApp);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

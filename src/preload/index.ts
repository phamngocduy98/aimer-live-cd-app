import { contextBridge, ipcRenderer } from "electron";

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  getApiBaseUrl: () => ipcRenderer.invoke("get-api-base-url"),
  getStreamBaseUrl: () => ipcRenderer.invoke("get-stream-base-url"),
  getDirectStreamBaseUrl: () => ipcRenderer.invoke("get-direct-stream-base-url"),
  storeAesPassword: (password: string) => ipcRenderer.invoke("store-aes-password", password),
  hasStoredAesPassword: () => ipcRenderer.invoke("has-stored-aes-password"),
  clearStoredAesPassword: () => ipcRenderer.invoke("clear-stored-aes-password")
});

import { contextBridge, ipcRenderer } from "electron";

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  submitPassword: (password: string) => ipcRenderer.send("submit-password", password),
  getPort: () => ipcRenderer.invoke("get-port")
});

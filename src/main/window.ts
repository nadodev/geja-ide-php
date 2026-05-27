import { BrowserWindow } from "electron";
import path from "node:path";

export const createMainWindow = () => {
  const preloadPath = path.resolve(__dirname, "../preload/index.cjs");
  const rendererIndexPath = path.resolve(__dirname, "../renderer/index.html");

  const window = new BrowserWindow({
    width: 1500,
    height: 920,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: "#0e131a",
    title: "GEJA PHP IDE",
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      devTools: true
    }
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;

  if (devServerUrl) {
    void window.loadURL(devServerUrl);
  } else {
    void window.loadFile(rendererIndexPath);
  }

  return window;
};

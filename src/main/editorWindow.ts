import path from "node:path";
import { BrowserWindow, app } from "electron";
import { EDITOR_URL } from "../shared/api";

export function createEditorWindow(title: string): BrowserWindow {
  const window = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    title,
    show: false,
    backgroundColor: "#151518",
    webPreferences: {
      preload: path.join(__dirname, "..", "preload", "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  });
  window.setMenuBarVisibility(false);
  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  window.webContents.on("will-navigate", (event, url) => {
    if (url !== EDITOR_URL) event.preventDefault();
  });
  window.once("ready-to-show", () => {
    window.show();
    if (process.platform === "darwin") app.focus({ steal: true });
  });
  void window.loadURL(EDITOR_URL);
  return window;
}

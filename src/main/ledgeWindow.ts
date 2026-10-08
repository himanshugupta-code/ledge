import path from "node:path";
import { BrowserWindow, type Display } from "electron";
import { DEFAULT_REVEAL } from "../core/reveal";
import { APP_URL, Channels } from "../shared/api";

const EXIT_ANIMATION_MS = 200;

export class LedgeWindow {
  private readonly window: BrowserWindow;
  private hideTimer: NodeJS.Timeout | null = null;
  private visible = false;

  constructor(onBlur: () => void) {
    this.window = new BrowserWindow({
      show: false,
      frame: false,
      transparent: true,
      resizable: false,
      movable: false,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      skipTaskbar: true,
      hasShadow: false,
      alwaysOnTop: true,
      backgroundColor: "#00000000",
      webPreferences: {
        preload: path.join(__dirname, "..", "preload", "preload.js"),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        spellcheck: false,
      },
    });
    this.window.setAlwaysOnTop(true, "pop-up-menu");
    this.window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    this.window.on("blur", onBlur);
    this.window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
    this.window.webContents.on("will-navigate", (event, url) => {
      if (url !== APP_URL) event.preventDefault();
    });
    void this.window.loadURL(APP_URL);
  }

  get webContents() {
    return this.window.webContents;
  }

  isVisible(): boolean {
    return this.visible;
  }

  show(display: Display, focus: boolean): void {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
    const { x, y, width } = display.workArea;
    this.window.setBounds({ x, y, width, height: DEFAULT_REVEAL.stripHeight });
    if (focus) {
      this.window.show();
      this.window.focus();
    } else {
      this.window.showInactive();
    }
    this.visible = true;
    this.window.webContents.send(Channels.reveal, true);
  }

  hide(): void {
    if (!this.visible) return;
    this.visible = false;
    this.window.webContents.send(Channels.reveal, false);
    this.hideTimer = setTimeout(() => {
      this.hideTimer = null;
      if (!this.visible) this.window.hide();
    }, EXIT_ANIMATION_MS);
  }
}

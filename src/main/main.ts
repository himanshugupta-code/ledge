import { execFile } from "node:child_process";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  BrowserWindow,
  Menu,
  Tray,
  app,
  clipboard,
  dialog,
  globalShortcut,
  ipcMain,
  nativeImage,
  net,
  protocol,
  screen,
  shell,
  type Display,
} from "electron";
import { resolveAppFile } from "../core/appPath";
import { editedName, isInside, isPng, uniqueName, withPngExtension } from "../core/files";
import { initialReveal, nextReveal, toggle, type RevealState } from "../core/reveal";
import { defaultScreenshotDir } from "../core/screenshotDir";
import { addItem, findItem, parseShelf, removeItem, type ShelfItem } from "../core/shelf";
import { parseSettings, type Settings } from "../core/settings";
import { Channels, ITEM_PROTOCOL, itemUrl, type EditorItem, type LedgeItem, type SaveResult } from "../shared/api";
import { createEditorWindow } from "./editorWindow";
import { LedgeWindow } from "./ledgeWindow";
import { fileExists, moveInto, readJson, writeJson } from "./storage";
import { watchFolder, type FolderWatch } from "./watcher";

const POLL_MS = 100;
const PEEK_MS = 1800;

protocol.registerSchemesAsPrivileged([
  { scheme: ITEM_PROTOCOL, privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } },
]);

if (!app.requestSingleInstanceLock()) app.quit();

const dataDir = () => app.getPath("userData");
const capturesDir = () => path.join(dataDir(), "Captures");
const shelfFile = () => path.join(dataDir(), "shelf.json");
const settingsFile = () => path.join(dataDir(), "settings.json");

let settings: Settings;
let items: ShelfItem[] = [];
let ledge: LedgeWindow;
let tray: Tray;
let watch: FolderWatch | null = null;
let watchedDir = "";
let reveal: RevealState = initialReveal;
let revealDisplay: Display | null = null;
let peekUntil = 0;
const editors = new Map<number, ShelfItem>();
const editorWindows = new Map<string, BrowserWindow>();

function toLedgeItem(item: ShelfItem): LedgeItem {
  return { id: item.id, name: item.name, src: itemUrl(item.id, item.addedAt), addedAt: item.addedAt };
}

function publish(): void {
  writeJson(shelfFile(), items);
  ledge.webContents.send(Channels.items, items.map(toLedgeItem));
  refreshTray();
}

function letGo(gone: ShelfItem[]): void {
  for (const item of gone) {
    if (item.owned && isInside(item.path, capturesDir())) void shell.trashItem(item.path).catch(() => {});
  }
}

function addToShelf(file: string, owned: boolean): void {
  const result = addItem(items, {
    id: randomUUID(),
    path: file,
    name: path.basename(file),
    addedAt: Date.now(),
    owned,
  });
  items = result.items;
  letGo(result.evicted);
  publish();
}

function addCapture(file: string): void {
  if (items.some((item) => item.path === file)) return;
  let target = file;
  let owned = false;
  if (settings.tidyDesktop) {
    try {
      target = moveInto(capturesDir(), file);
      owned = true;
    } catch {
      target = file;
    }
  }
  addToShelf(target, owned);
  if (settings.peekOnCapture && reveal.mode === "hidden") peek();
}

function openEditor(id: string): void {
  const item = findItem(items, id);
  if (!item) return;
  applyReveal(initialReveal, displayUnderCursor());
  const existing = editorWindows.get(item.id);
  if (existing && !existing.isDestroyed()) {
    existing.show();
    existing.focus();
    return;
  }
  const window = createEditorWindow(`${item.name} — Ledge`);
  const contentsId = window.webContents.id;
  editors.set(contentsId, { ...item });
  editorWindows.set(item.id, window);
  window.on("closed", () => {
    editors.delete(contentsId);
    editorWindows.delete(item.id);
  });
}

function writePng(target: string, png: Uint8Array): SaveResult {
  try {
    fs.writeFileSync(target, png);
    return { ok: true, name: path.basename(target) };
  } catch (error) {
    return { ok: false, error: `Couldn’t save: ${(error as Error).message}` };
  }
}

function remove(id: string): void {
  const result = removeItem(items, id);
  items = result.items;
  letGo(result.evicted);
  publish();
}

function readMacCaptureLocation(): Promise<string | null> {
  if (process.platform !== "darwin") return Promise.resolve(null);
  return new Promise((resolve) => {
    execFile("defaults", ["read", "com.apple.screencapture", "location"], (error, stdout) =>
      resolve(error ? null : stdout),
    );
  });
}

async function startWatching(): Promise<void> {
  watch?.close();
  watchedDir = settings.watchDir ?? defaultScreenshotDir(process.platform, os.homedir(), await readMacCaptureLocation());
  watch = watchFolder(watchedDir, addCapture, (error) => {
    console.error(`Ledge could not watch ${watchedDir}: ${error.message}`);
  });
  refreshTray();
}

function displayUnderCursor(): Display {
  return screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
}

function applyReveal(next: RevealState, display: Display, focus = false): void {
  const wasHidden = reveal.mode === "hidden";
  reveal = next;
  if (next.mode === "hidden") {
    revealDisplay = null;
    ledge.hide();
  } else if (wasHidden) {
    revealDisplay = display;
    ledge.show(display, focus);
  }
  if (wasHidden !== (next.mode === "hidden")) refreshTray();
}

function peek(): void {
  peekUntil = Date.now() + PEEK_MS;
  applyReveal({ mode: "hover", edgeSince: null }, displayUnderCursor());
}

function poll(): void {
  if (reveal.mode === "pinned" || Date.now() < peekUntil) return;
  const point = screen.getCursorScreenPoint();
  const display = revealDisplay ?? screen.getDisplayNearestPoint(point);
  const next = nextReveal(reveal, { ...point, time: Date.now() }, display.bounds);
  if (next.mode !== reveal.mode) applyReveal(next, display);
  else reveal = next;
}

function toggleLedge(): void {
  peekUntil = 0;
  applyReveal(toggle(reveal), displayUnderCursor(), true);
}

function saveSettings(patch: Partial<Settings>): void {
  settings = { ...settings, ...patch };
  writeJson(settingsFile(), settings);
}

async function chooseFolder(): Promise<void> {
  const result = await dialog.showOpenDialog({
    title: "Choose the folder your screenshots are saved to",
    defaultPath: watchedDir,
    properties: ["openDirectory", "createDirectory"],
  });
  if (result.canceled || result.filePaths.length === 0) return;
  saveSettings({ watchDir: result.filePaths[0] });
  await startWatching();
}

function trayImage() {
  const image = nativeImage.createFromPath(path.join(__dirname, "..", "..", "assets", "trayTemplate.png"));
  image.setTemplateImage(true);
  return image;
}

function refreshTray(): void {
  if (!tray) return;
  const shortcut = settings.shortcut.replace("CommandOrControl", process.platform === "darwin" ? "Cmd" : "Ctrl");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: reveal.mode === "hidden" ? "Show Ledge" : "Hide Ledge", accelerator: settings.shortcut, click: toggleLedge },
      { type: "separator" },
      { label: `Watching: ${watchedDir.replace(os.homedir(), "~")}`, enabled: false },
      { label: "Choose Folder…", click: () => void chooseFolder() },
      {
        label: "Move New Screenshots into Ledge",
        type: "checkbox",
        checked: settings.tidyDesktop,
        click: (menuItem) => saveSettings({ tidyDesktop: menuItem.checked }),
      },
      {
        label: "Peek When a Screenshot Arrives",
        type: "checkbox",
        checked: settings.peekOnCapture,
        click: (menuItem) => saveSettings({ peekOnCapture: menuItem.checked }),
      },
      { type: "separator" },
      {
        label: `Clear Ledge (${items.length})`,
        enabled: items.length > 0,
        click: () => {
          letGo(items);
          items = [];
          publish();
        },
      },
      { label: "Quit Ledge", click: () => app.quit() },
    ]),
  );
  tray.setToolTip(`Ledge — ${shortcut} to show`);
}

function registerIpc(): void {
  const lookup = (id: unknown) => (typeof id === "string" ? findItem(items, id) : undefined);

  ipcMain.handle(Channels.getItems, () => items.map(toLedgeItem));
  ipcMain.handle(Channels.copy, (_event, id) => {
    const item = lookup(id);
    if (!item) return false;
    const image = nativeImage.createFromPath(item.path);
    if (image.isEmpty()) return false;
    clipboard.writeImage(image);
    return true;
  });
  ipcMain.on(Channels.open, (_event, id) => {
    const item = lookup(id);
    if (item) void shell.openPath(item.path);
  });
  ipcMain.on(Channels.showInFolder, (_event, id) => {
    const item = lookup(id);
    if (item) shell.showItemInFolder(item.path);
  });
  ipcMain.on(Channels.startDrag, (event, id) => {
    const item = lookup(id);
    if (!item) return;
    const preview = nativeImage.createFromPath(item.path);
    const icon = preview.isEmpty() ? trayImage() : preview.resize({ height: 72 });
    event.sender.startDrag({ file: item.path, icon });
  });
  ipcMain.on(Channels.remove, (_event, id) => {
    if (typeof id === "string") remove(id);
  });
  ipcMain.on(Channels.edit, (_event, id) => {
    if (typeof id === "string") openEditor(id);
  });
  ipcMain.handle(Channels.editorItem, (event): EditorItem | null => {
    const item = editors.get(event.sender.id);
    return item ? { id: item.id, name: item.name, src: itemUrl(item.id, item.addedAt) } : null;
  });
  ipcMain.handle(Channels.editorCopy, (event, png: unknown) => {
    if (!editors.has(event.sender.id) || !isPng(png)) return false;
    const image = nativeImage.createFromBuffer(Buffer.from(png));
    if (image.isEmpty()) return false;
    clipboard.writeImage(image);
    return true;
  });
  ipcMain.handle(Channels.editorSave, (event, png: unknown): SaveResult => {
    const item = editors.get(event.sender.id);
    if (!item || !isPng(png)) return { ok: false, error: "Couldn’t save this image." };
    const dir = path.dirname(item.path);
    let target: string;
    try {
      target = path.join(dir, uniqueName(editedName(item.name), new Set(fs.readdirSync(dir))));
    } catch (error) {
      return { ok: false, error: `Couldn’t save: ${(error as Error).message}` };
    }
    const result = writePng(target, png);
    if (result.ok) addToShelf(target, isInside(target, capturesDir()));
    return result;
  });
  ipcMain.handle(Channels.editorSaveAs, async (event, png: unknown): Promise<SaveResult> => {
    const item = editors.get(event.sender.id);
    if (!item || !isPng(png)) return { ok: false, error: "Couldn’t save this image." };
    const owner = BrowserWindow.fromWebContents(event.sender);
    const options = {
      title: "Save Image",
      defaultPath: path.join(path.dirname(item.path), editedName(item.name)),
      filters: [{ name: "PNG Image", extensions: ["png"] }],
    };
    const choice = owner ? await dialog.showSaveDialog(owner, options) : await dialog.showSaveDialog(options);
    if (choice.canceled || !choice.filePath) return { ok: false };
    return writePng(withPngExtension(choice.filePath), png);
  });
  ipcMain.on(Channels.dismiss, () => {
    peekUntil = 0;
    applyReveal(initialReveal, displayUnderCursor());
  });
}

const notFound = () => new Response(null, { status: 404 });

function registerProtocol(): void {
  const rendererRoot = path.join(__dirname, "..", "renderer");
  protocol.handle(ITEM_PROTOCOL, (request) => {
    const url = new URL(request.url);
    if (url.hostname !== "app") return notFound();
    if (url.pathname.startsWith("/item/")) {
      const id = decodeURIComponent(url.pathname.slice("/item/".length));
      const item = findItem(items, id) ?? [...editors.values()].find((entry) => entry.id === id);
      return item ? net.fetch(pathToFileURL(item.path).toString()) : notFound();
    }
    const file = resolveAppFile(rendererRoot, url.pathname);
    return file ? net.fetch(pathToFileURL(file).toString()) : notFound();
  });
}

app.on("second-instance", toggleLedge);
app.on("window-all-closed", () => {});
app.on("will-quit", () => {
  globalShortcut.unregisterAll();
  watch?.close();
});

void app.whenReady().then(async () => {
  app.dock?.hide();
  settings = parseSettings(readJson(settingsFile()));
  items = parseShelf(readJson(shelfFile()))
    .filter((item) => fileExists(item.path))
    .map((item) => ({ ...item, owned: item.owned && isInside(item.path, capturesDir()) }));

  registerProtocol();
  registerIpc();
  ledge = new LedgeWindow(() => {
    if (reveal.mode === "pinned") applyReveal(initialReveal, displayUnderCursor());
  });
  tray = new Tray(trayImage());
  if (process.platform !== "darwin") tray.on("click", toggleLedge);

  if (!globalShortcut.register(settings.shortcut, toggleLedge)) {
    console.error(`Ledge could not register the shortcut ${settings.shortcut}.`);
  }

  await startWatching();
  setInterval(poll, POLL_MS);
});

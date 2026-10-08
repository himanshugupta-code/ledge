import { contextBridge, ipcRenderer, type IpcRendererEvent } from "electron";
import type { Channels as SharedChannels, EditorApi, LedgeApi, LedgeItem } from "../shared/api";

const Channels: typeof SharedChannels = {
  getItems: "ledge:get-items",
  edit: "ledge:edit",
  editorItem: "editor:item",
  editorCopy: "editor:copy",
  editorSave: "editor:save",
  editorSaveAs: "editor:save-as",
  items: "ledge:items",
  reveal: "ledge:reveal",
  copy: "ledge:copy",
  open: "ledge:open",
  showInFolder: "ledge:show-in-folder",
  startDrag: "ledge:start-drag",
  remove: "ledge:remove",
  dismiss: "ledge:dismiss",
};

function subscribe<T>(channel: string, listener: (value: T) => void) {
  const handler = (_event: IpcRendererEvent, value: T) => listener(value);
  ipcRenderer.on(channel, handler);
  return () => {
    ipcRenderer.removeListener(channel, handler);
  };
}

const api: LedgeApi = {
  getItems: () => ipcRenderer.invoke(Channels.getItems),
  edit: (id) => ipcRenderer.send(Channels.edit, id),
  onItems: (listener) => subscribe<LedgeItem[]>(Channels.items, listener),
  onReveal: (listener) => subscribe<boolean>(Channels.reveal, listener),
  copy: (id) => ipcRenderer.invoke(Channels.copy, id),
  open: (id) => ipcRenderer.send(Channels.open, id),
  showInFolder: (id) => ipcRenderer.send(Channels.showInFolder, id),
  startDrag: (id) => ipcRenderer.send(Channels.startDrag, id),
  remove: (id) => ipcRenderer.send(Channels.remove, id),
  dismiss: () => ipcRenderer.send(Channels.dismiss),
};

const editor: EditorApi = {
  getItem: () => ipcRenderer.invoke(Channels.editorItem),
  copy: (png) => ipcRenderer.invoke(Channels.editorCopy, png),
  save: (png) => ipcRenderer.invoke(Channels.editorSave, png),
  saveAs: (png) => ipcRenderer.invoke(Channels.editorSaveAs, png),
};

contextBridge.exposeInMainWorld("ledge", api);
contextBridge.exposeInMainWorld("ledgeEditor", editor);

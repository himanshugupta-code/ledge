import { contextBridge, ipcRenderer, type IpcRendererEvent } from "electron";
import type { Channels as SharedChannels, LedgeApi, LedgeItem } from "../shared/api";

const Channels: typeof SharedChannels = {
  getItems: "ledge:get-items",
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
  onItems: (listener) => subscribe<LedgeItem[]>(Channels.items, listener),
  onReveal: (listener) => subscribe<boolean>(Channels.reveal, listener),
  copy: (id) => ipcRenderer.invoke(Channels.copy, id),
  open: (id) => ipcRenderer.send(Channels.open, id),
  showInFolder: (id) => ipcRenderer.send(Channels.showInFolder, id),
  startDrag: (id) => ipcRenderer.send(Channels.startDrag, id),
  remove: (id) => ipcRenderer.send(Channels.remove, id),
  dismiss: () => ipcRenderer.send(Channels.dismiss),
};

contextBridge.exposeInMainWorld("ledge", api);

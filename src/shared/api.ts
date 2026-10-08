export interface LedgeItem {
  id: string;
  name: string;
  src: string;
  addedAt: number;
}

export type Unsubscribe = () => void;

export interface LedgeApi {
  getItems(): Promise<LedgeItem[]>;
  edit(id: string): void;
  onItems(listener: (items: LedgeItem[]) => void): Unsubscribe;
  onReveal(listener: (visible: boolean) => void): Unsubscribe;
  copy(id: string): Promise<boolean>;
  open(id: string): void;
  showInFolder(id: string): void;
  startDrag(id: string): void;
  remove(id: string): void;
  dismiss(): void;
}

export interface EditorItem {
  id: string;
  name: string;
  src: string;
}

export interface SaveResult {
  ok: boolean;
  name?: string;
  error?: string;
}

export interface EditorApi {
  getItem(): Promise<EditorItem | null>;
  copy(png: Uint8Array): Promise<boolean>;
  save(png: Uint8Array): Promise<SaveResult>;
  saveAs(png: Uint8Array): Promise<SaveResult>;
}

export const Channels = {
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
} as const;

export const ITEM_PROTOCOL = "ledge";

export const APP_URL = `${ITEM_PROTOCOL}://app/index.html`;

export const EDITOR_URL = `${ITEM_PROTOCOL}://app/editor.html`;

export function itemUrl(id: string, addedAt: number): string {
  return `${ITEM_PROTOCOL}://app/item/${encodeURIComponent(id)}?v=${addedAt}`;
}

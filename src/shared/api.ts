export interface LedgeItem {
  id: string;
  name: string;
  src: string;
  addedAt: number;
}

export type Unsubscribe = () => void;

export interface LedgeApi {
  getItems(): Promise<LedgeItem[]>;
  onItems(listener: (items: LedgeItem[]) => void): Unsubscribe;
  onReveal(listener: (visible: boolean) => void): Unsubscribe;
  copy(id: string): Promise<boolean>;
  open(id: string): void;
  showInFolder(id: string): void;
  startDrag(id: string): void;
  remove(id: string): void;
  dismiss(): void;
}

export const Channels = {
  getItems: "ledge:get-items",
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

export function itemUrl(id: string, addedAt: number): string {
  return `${ITEM_PROTOCOL}://item/${encodeURIComponent(id)}?v=${addedAt}`;
}

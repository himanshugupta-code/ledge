export interface ShelfItem {
  id: string;
  path: string;
  name: string;
  addedAt: number;
  owned: boolean;
}

export interface AddResult {
  items: ShelfItem[];
  evicted: ShelfItem[];
}

export const DEFAULT_LIMIT = 24;

export function addItem(items: readonly ShelfItem[], item: ShelfItem, limit = DEFAULT_LIMIT): AddResult {
  const rest = items.filter((existing) => existing.path !== item.path);
  const next = [item, ...rest];
  return { items: next.slice(0, limit), evicted: next.slice(limit) };
}

export function removeItem(items: readonly ShelfItem[], id: string): AddResult {
  return {
    items: items.filter((item) => item.id !== id),
    evicted: items.filter((item) => item.id === id),
  };
}

export function findItem(items: readonly ShelfItem[], id: string): ShelfItem | undefined {
  return items.find((item) => item.id === id);
}

export function parseShelf(raw: unknown, limit = DEFAULT_LIMIT): ShelfItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(isShelfItem).slice(0, limit);
}

function isShelfItem(value: unknown): value is ShelfItem {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.path === "string" &&
    typeof item.name === "string" &&
    typeof item.addedAt === "number" &&
    typeof item.owned === "boolean"
  );
}

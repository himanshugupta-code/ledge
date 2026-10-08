import { describe, expect, it } from "vitest";
import { addItem, findItem, parseShelf, removeItem, type ShelfItem } from "./shelf";

const item = (id: string, path = `/shots/${id}.png`): ShelfItem => ({
  id,
  path,
  name: `${id}.png`,
  addedAt: 0,
  owned: false,
});

describe("addItem", () => {
  it("puts the newest item first", () => {
    const { items } = addItem([item("a")], item("b"));
    expect(items.map((i) => i.id)).toEqual(["b", "a"]);
  });

  it("replaces an existing entry for the same file", () => {
    const { items, evicted } = addItem([item("a"), item("b")], item("c", "/shots/a.png"));
    expect(items.map((i) => i.id)).toEqual(["c", "b"]);
    expect(evicted).toEqual([]);
  });

  it("evicts the oldest items past the limit", () => {
    const { items, evicted } = addItem([item("b"), item("a")], item("c"), 2);
    expect(items.map((i) => i.id)).toEqual(["c", "b"]);
    expect(evicted.map((i) => i.id)).toEqual(["a"]);
  });
});

describe("removeItem", () => {
  it("removes by id and reports what was removed", () => {
    const { items, evicted } = removeItem([item("a"), item("b")], "a");
    expect(items.map((i) => i.id)).toEqual(["b"]);
    expect(evicted.map((i) => i.id)).toEqual(["a"]);
  });

  it("is a no-op for unknown ids", () => {
    const { items, evicted } = removeItem([item("a")], "zzz");
    expect(items).toHaveLength(1);
    expect(evicted).toHaveLength(0);
  });
});

describe("findItem", () => {
  it("finds by id", () => {
    expect(findItem([item("a"), item("b")], "b")?.path).toBe("/shots/b.png");
    expect(findItem([item("a")], "b")).toBeUndefined();
  });
});

describe("parseShelf", () => {
  it("keeps only well-formed items", () => {
    const parsed = parseShelf([item("a"), { id: "b" }, null, "x", item("c")]);
    expect(parsed.map((i) => i.id)).toEqual(["a", "c"]);
  });

  it("returns an empty shelf for invalid input", () => {
    expect(parseShelf({ items: [] })).toEqual([]);
    expect(parseShelf(undefined)).toEqual([]);
  });

  it("applies the limit", () => {
    expect(parseShelf([item("a"), item("b"), item("c")], 2)).toHaveLength(2);
  });
});

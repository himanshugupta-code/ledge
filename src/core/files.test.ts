import { describe, expect, it } from "vitest";
import { RECENT_WINDOW_MS, isImageFile, isInside, isRecentlyCreated, uniqueName } from "./files";

describe("isImageFile", () => {
  it("accepts common screenshot formats regardless of case", () => {
    expect(isImageFile("Screenshot 2026-10-08 at 10.12.01.png")).toBe(true);
    expect(isImageFile("capture.JPG")).toBe(true);
    expect(isImageFile("/a/b/shot.heic")).toBe(true);
  });

  it("rejects hidden temp files and non-images", () => {
    expect(isImageFile(".Screenshot 2026-10-08.png")).toBe(false);
    expect(isImageFile("notes.txt")).toBe(false);
    expect(isImageFile("archive.png.zip")).toBe(false);
  });
});

describe("uniqueName", () => {
  it("keeps a free name", () => {
    expect(uniqueName("shot.png", new Set())).toBe("shot.png");
  });

  it("adds the first free counter", () => {
    expect(uniqueName("shot.png", new Set(["shot.png", "shot (2).png"]))).toBe("shot (3).png");
  });
});

describe("isInside", () => {
  it("detects files inside a folder", () => {
    expect(isInside("/data/captures/a.png", "/data/captures")).toBe(true);
  });

  it("rejects the folder itself, siblings and lookalike prefixes", () => {
    expect(isInside("/data/captures", "/data/captures")).toBe(false);
    expect(isInside("/data/other/a.png", "/data/captures")).toBe(false);
    expect(isInside("/data/captures-old/a.png", "/data/captures")).toBe(false);
  });
});

describe("isRecentlyCreated", () => {
  const now = 1_000_000_000;

  it("accepts files created within the window", () => {
    expect(isRecentlyCreated(now - 1000, now, now)).toBe(true);
  });

  it("rejects older files that were only renamed or touched", () => {
    expect(isRecentlyCreated(now - RECENT_WINDOW_MS - 1, now, now)).toBe(false);
  });

  it("falls back to the modified time when the filesystem has no birth time", () => {
    expect(isRecentlyCreated(0, now - 500, now)).toBe(true);
    expect(isRecentlyCreated(0, now - RECENT_WINDOW_MS - 1, now)).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { RECENT_WINDOW_MS, editedName, isImageFile, isInside, isPng, isRecentlyCreated, uniqueName, withPngExtension } from "./files";

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

describe("editedName", () => {
  it("adds an edited suffix and a png extension", () => {
    expect(editedName("Screenshot 2026-10-08 at 10.12.jpg")).toBe("Screenshot 2026-10-08 at 10.12 edited.png");
    expect(editedName("/shots/capture")).toBe("capture edited.png");
  });
});

describe("withPngExtension", () => {
  it("appends .png only when missing", () => {
    expect(withPngExtension("/a/shot")).toBe("/a/shot.png");
    expect(withPngExtension("/a/shot.PNG")).toBe("/a/shot.PNG");
  });
});

describe("isPng", () => {
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

  it("accepts PNG bytes", () => {
    expect(isPng(new Uint8Array([...signature, 0, 0, 0]))).toBe(true);
  });

  it("rejects other data", () => {
    expect(isPng(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0]))).toBe(false);
    expect(isPng(new Uint8Array(signature))).toBe(false);
    expect(isPng("png")).toBe(false);
    expect(isPng(null)).toBe(false);
  });
});

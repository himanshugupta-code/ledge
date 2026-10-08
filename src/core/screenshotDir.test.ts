import path from "node:path";
import { describe, expect, it } from "vitest";
import { defaultScreenshotDir, expandHome } from "./screenshotDir";

const home = "/Users/ada";

describe("expandHome", () => {
  it("expands a leading tilde", () => {
    expect(expandHome("~/Pictures", home)).toBe(path.join(home, "Pictures"));
    expect(expandHome("~", home)).toBe(home);
  });

  it("leaves other paths untouched", () => {
    expect(expandHome("/tmp/shots", home)).toBe("/tmp/shots");
    expect(expandHome("~ada/shots", home)).toBe("~ada/shots");
  });
});

describe("defaultScreenshotDir", () => {
  it("uses the Desktop on macOS when no capture location is set", () => {
    expect(defaultScreenshotDir("darwin", home, null)).toBe(path.join(home, "Desktop"));
    expect(defaultScreenshotDir("darwin", home, "  ")).toBe(path.join(home, "Desktop"));
  });

  it("uses the configured macOS capture location", () => {
    expect(defaultScreenshotDir("darwin", home, "~/Shots\n")).toBe(path.join(home, "Shots"));
  });

  it("uses Pictures/Screenshots on Windows and Linux", () => {
    expect(defaultScreenshotDir("win32", home)).toBe(path.join(home, "Pictures", "Screenshots"));
    expect(defaultScreenshotDir("linux", home)).toBe(path.join(home, "Pictures", "Screenshots"));
  });
});

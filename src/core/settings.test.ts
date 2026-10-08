import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, parseSettings } from "./settings";

describe("parseSettings", () => {
  it("falls back to defaults for missing or invalid input", () => {
    expect(parseSettings(undefined)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings("nope")).toEqual(DEFAULT_SETTINGS);
  });

  it("keeps valid values and replaces invalid ones", () => {
    const parsed = parseSettings({ watchDir: "/shots", tidyDesktop: true, peekOnCapture: "yes", shortcut: "" });
    expect(parsed).toEqual({ ...DEFAULT_SETTINGS, watchDir: "/shots", tidyDesktop: true });
  });

  it("treats an empty watch folder as unset", () => {
    expect(parseSettings({ watchDir: "" }).watchDir).toBeNull();
  });
});

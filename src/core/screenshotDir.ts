import path from "node:path";

export function expandHome(input: string, home: string): string {
  if (input === "~") return home;
  if (input.startsWith("~/")) return path.join(home, input.slice(2));
  return input;
}

export function defaultScreenshotDir(
  platform: NodeJS.Platform,
  home: string,
  macCaptureLocation?: string | null,
): string {
  if (platform === "darwin") {
    const location = macCaptureLocation?.trim();
    return location ? expandHome(location, home) : path.join(home, "Desktop");
  }
  return path.join(home, "Pictures", "Screenshots");
}

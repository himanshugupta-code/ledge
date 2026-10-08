import path from "node:path";

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".heic", ".webp", ".gif", ".tiff"]);

export function isImageFile(fileName: string): boolean {
  const base = path.basename(fileName);
  if (base.startsWith(".")) return false;
  return IMAGE_EXTENSIONS.has(path.extname(base).toLowerCase());
}

export function uniqueName(fileName: string, taken: ReadonlySet<string>): string {
  if (!taken.has(fileName)) return fileName;
  const ext = path.extname(fileName);
  const stem = fileName.slice(0, fileName.length - ext.length);
  let index = 2;
  while (taken.has(`${stem} (${index})${ext}`)) index += 1;
  return `${stem} (${index})${ext}`;
}

export function isInside(child: string, parent: string): boolean {
  const relative = path.relative(parent, child);
  return relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative);
}

export const RECENT_WINDOW_MS = 2 * 60 * 1000;

export function isRecentlyCreated(birthtimeMs: number, mtimeMs: number, now: number): boolean {
  const created = birthtimeMs > 0 ? birthtimeMs : mtimeMs;
  return now - created <= RECENT_WINDOW_MS;
}

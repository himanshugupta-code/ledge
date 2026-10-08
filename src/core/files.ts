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

export function editedName(original: string): string {
  const base = path.basename(original);
  const ext = path.extname(base);
  const stem = ext && ext !== base ? base.slice(0, -ext.length) : base;
  return `${stem} edited.png`;
}

export function withPngExtension(file: string): string {
  return path.extname(file).toLowerCase() === ".png" ? file : `${file}.png`;
}

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
export const MAX_IMAGE_BYTES = 200 * 1024 * 1024;

export function isPng(data: unknown): data is Uint8Array {
  return (
    data instanceof Uint8Array &&
    data.length > PNG_SIGNATURE.length &&
    data.length <= MAX_IMAGE_BYTES &&
    PNG_SIGNATURE.every((byte, i) => data[i] === byte)
  );
}

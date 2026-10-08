import path from "node:path";

export function resolveAppFile(root: string, urlPath: string): string | null {
  let decoded: string;
  try {
    decoded = decodeURIComponent(urlPath);
  } catch {
    return null;
  }
  if (decoded.includes("\0")) return null;
  const relative = decoded.replace(/^\/+/, "") || "index.html";
  const resolved = path.resolve(root, relative);
  const fromRoot = path.relative(root, resolved);
  if (fromRoot === "" || fromRoot.startsWith("..") || path.isAbsolute(fromRoot)) return null;
  return resolved;
}

import fs from "node:fs";
import path from "node:path";
import { isImageFile, isRecentlyCreated } from "../core/files";

export interface FolderWatch {
  close(): void;
}

const SETTLE_MS = 250;
const MAX_CHECKS = 40;

export function watchFolder(
  dir: string,
  onImage: (file: string) => void,
  onError: (error: Error) => void,
): FolderWatch {
  const pending = new Map<string, NodeJS.Timeout>();

  const settle = (file: string, lastSize: number, checks: number) => {
    fs.stat(file, (error, stats) => {
      if (error || !stats.isFile()) {
        pending.delete(file);
        return;
      }
      if (stats.size > 0 && stats.size === lastSize) {
        pending.delete(file);
        if (isRecentlyCreated(stats.birthtimeMs, stats.mtimeMs, Date.now())) onImage(file);
        return;
      }
      if (checks >= MAX_CHECKS) {
        pending.delete(file);
        return;
      }
      pending.set(file, setTimeout(() => settle(file, stats.size, checks + 1), SETTLE_MS));
    });
  };

  let watcher: fs.FSWatcher;
  try {
    watcher = fs.watch(dir, (_event, name) => {
      if (!name) return;
      const file = path.join(dir, name.toString());
      if (!isImageFile(file) || pending.has(file)) return;
      pending.set(file, setTimeout(() => settle(file, -1, 0), SETTLE_MS));
    });
  } catch (error) {
    onError(error as Error);
    return { close() {} };
  }

  watcher.on("error", onError);

  return {
    close() {
      watcher.close();
      for (const timer of pending.values()) clearTimeout(timer);
      pending.clear();
    },
  };
}

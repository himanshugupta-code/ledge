import fs from "node:fs";
import path from "node:path";
import { uniqueName } from "../core/files";

export function readJson(file: string): unknown {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return undefined;
  }
}

export function writeJson(file: string, data: unknown): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(data, null, 2));
  fs.renameSync(temp, file);
}

export function moveInto(dir: string, file: string): string {
  fs.mkdirSync(dir, { recursive: true });
  const name = uniqueName(path.basename(file), new Set(fs.readdirSync(dir)));
  const target = path.join(dir, name);
  try {
    fs.renameSync(file, target);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EXDEV") throw error;
    fs.copyFileSync(file, target);
    fs.unlinkSync(file);
  }
  return target;
}

export function fileExists(file: string): boolean {
  try {
    return fs.statSync(file).isFile();
  } catch {
    return false;
  }
}

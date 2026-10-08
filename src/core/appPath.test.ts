import path from "node:path";
import { describe, expect, it } from "vitest";
import { resolveAppFile } from "./appPath";

const root = path.resolve("/app/renderer");

describe("resolveAppFile", () => {
  it("serves index.html for the root path", () => {
    expect(resolveAppFile(root, "/")).toBe(path.join(root, "index.html"));
  });

  it("resolves nested asset paths", () => {
    expect(resolveAppFile(root, "/assets/index.js")).toBe(path.join(root, "assets", "index.js"));
  });

  it("blocks traversal outside the root, including encoded forms", () => {
    expect(resolveAppFile(root, "/../secrets.txt")).toBeNull();
    expect(resolveAppFile(root, "/assets/..%2F..%2Fsecrets.txt")).toBeNull();
    expect(resolveAppFile(root, "/%2e%2e/secrets.txt")).toBeNull();
  });

  it("rejects malformed encodings and null bytes", () => {
    expect(resolveAppFile(root, "/%E0%A4%A")).toBeNull();
    expect(resolveAppFile(root, "/index.html%00.png")).toBeNull();
  });
});

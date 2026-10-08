export const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
export const ORIGIN = process.env.NEXT_PUBLIC_SITE_ORIGIN ?? "https://himanshugupta-code.github.io";
export const SITE_URL = `${ORIGIN}${BASE}`;
export const asset = (path: string) => `${BASE}${path}`;
/** Absolute URL for a site path such as "/en/privacy/". */
export const abs = (path: string) => `${SITE_URL}${path}`;
export const REPO = "https://github.com/himanshugupta-code/ledge";
export const RELEASE = `${REPO}/releases/latest`;
export const DMG_ARM = `${RELEASE}/download/Ledge-mac-arm64.dmg`;
export const DMG_X64 = `${RELEASE}/download/Ledge-mac-x64.dmg`;
export const SUPPORT = `${REPO}/issues`;
export const AUTHOR = { name: "Himanshu", url: "https://github.com/himanshugupta-code" };

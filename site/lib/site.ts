export const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
export const asset = (path: string) => `${BASE}${path}`;
export const REPO = "https://github.com/himanshugupta-code/ledge";
export const RELEASE = `${REPO}/releases/latest`;
export const SUPPORT = `${REPO}/issues`;

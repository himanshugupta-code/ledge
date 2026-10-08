import type { EditorApi, LedgeApi } from "../shared/api";

declare global {
  interface Window {
    ledge: LedgeApi;
    ledgeEditor: EditorApi;
  }
}

export {};

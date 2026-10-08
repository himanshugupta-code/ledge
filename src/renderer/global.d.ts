import type { LedgeApi } from "../shared/api";

declare global {
  interface Window {
    ledge: LedgeApi;
  }
}

export {};

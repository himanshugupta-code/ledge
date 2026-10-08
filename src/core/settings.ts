export interface Settings {
  watchDir: string | null;
  watchBookmark: string | null;
  tidyDesktop: boolean;
  peekOnCapture: boolean;
  shortcut: string;
}

export const DEFAULT_SETTINGS: Settings = {
  watchDir: null,
  watchBookmark: null,
  tidyDesktop: false,
  peekOnCapture: true,
  shortcut: "CommandOrControl+Alt+L",
};

export function parseSettings(raw: unknown): Settings {
  if (typeof raw !== "object" || raw === null) return { ...DEFAULT_SETTINGS };
  const value = raw as Record<string, unknown>;
  return {
    watchDir: typeof value.watchDir === "string" && value.watchDir.length > 0 ? value.watchDir : null,
    watchBookmark:
      typeof value.watchBookmark === "string" && value.watchBookmark.length > 0 ? value.watchBookmark : null,
    tidyDesktop: typeof value.tidyDesktop === "boolean" ? value.tidyDesktop : DEFAULT_SETTINGS.tidyDesktop,
    peekOnCapture:
      typeof value.peekOnCapture === "boolean" ? value.peekOnCapture : DEFAULT_SETTINGS.peekOnCapture,
    shortcut:
      typeof value.shortcut === "string" && value.shortcut.length > 0 ? value.shortcut : DEFAULT_SETTINGS.shortcut,
  };
}

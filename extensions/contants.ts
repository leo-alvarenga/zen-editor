import { Mode, Settings } from "./types";

export const CONFIG_FILE_NAME = "zen-editor.json";
export const DEFAULT_WIDGET_KEY = "zen-editor-widget";

export const DEFAULT_SETTINGS: Settings = {
  editor: {
    enableBadge: false,
  },
  widget: {
    enable: false,
  },
};

export const NAVIGATION_ARROWS: Record<string, string> = {
  h: "\x1b[D",
  j: "\x1b[B",
  k: "\x1b[A",
  l: "\x1b[C",
};

export const MODE_BY_KEY: Record<string, Mode> = {
  escape: "normal",
  i: "insert",
  a: "insert",
};

export const MOVE_BY_KEY: Record<string, string> = {
  a: NAVIGATION_ARROWS.l,
};

export const VALID_MOVES = new Set(Object.keys(NAVIGATION_ARROWS));

export const MODE_CHANGE_EVENT_KEY = "zen_editor_mode_change";

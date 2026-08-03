import type { FrameIcons, Settings, SpinnerPhase } from "./types";

export const CONFIG_FILE_NAME = "zen-editor.json";
export const DEFAULT_WIDGET_KEY = "zen-editor-widget";
export const MODE_CHANGE_EVENT_KEY = "zen_editor_mode_change";

/** pi-mode-manager integration (optional — no hard dependency). */
export const PI_MODE_MANAGER_MODE_EVENT = "pi-mode-manager:mode-changed";
export const PI_MODE_MANAGER_MODE_DATA_KEY = "pi-mode-manager-mode";

/** Raw CSI sequences pi's keybinding layer maps to arrow keys. */
export const NAVIGATION_ARROWS: Record<string, string> = {
  h: "\x1b[D",
  j: "\x1b[B",
  k: "\x1b[A",
  l: "\x1b[C",
};

/** Raw sequence for the "delete" key → deleteCharForward in the base editor. */
export const DELETE_FORWARD_KEY = "\x1b[3~";

/** Spinner animation frames per phase (pi-editor-shell style). */
export const SPINNER_FRAMES: Record<SpinnerPhase, string[]> = {
  thinking: ["●", "●", "○", "○"],
  outputting: ["⡀", "⣀", "⣄", "⣤", "⣦", "⣶", "⣷", "⣿"],
  toolcall: ["░", "▒", "▓", "█", "▓", "▒"],
  exec: ["◜", "◝", "◞", "◟"],
};

/** Nerd Font defaults (override any subset via `frame.icons`). */
export const DEFAULT_ICONS: FrameIcons = {
  model: "\uf4bc", //   oct-cpu
  thinking: "\uf400", // oct-light_bulb
  context: "\uf49b", //  oct-cache
  folder: "\uf07c", //  fa-folder_open
};

/** Thinking level → theme token, mirroring pi's own border-color mapping. */
export const THINKING_TOKEN: Record<string, string> = {
  off: "thinkingOff",
  minimal: "thinkingMinimal",
  low: "thinkingLow",
  medium: "thinkingMedium",
  high: "thinkingHigh",
  xhigh: "thinkingXhigh",
  max: "thinkingMax",
};

export const DEFAULT_SETTINGS: Settings = {
  widget: {
    enable: false,
  },
  vim: {
    visualMode: true,
  },
  frame: {
    enable: true,
    minWidth: 20,
    paddingTop: 1,
    paddingBottom: 1,
    paddingX: 1,
    marginTop: 0,
    marginBottom: 1,
    showModel: true,
    showThinking: true,
    showContext: true,
    showCwd: true,
    showAgentMode: true,
    showVimMode: true,
    icons: {},
  },
};

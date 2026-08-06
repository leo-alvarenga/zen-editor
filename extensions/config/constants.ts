import { ThemeColor } from "@earendil-works/pi-coding-agent";
import type { FrameIcons, Settings, SpinnerPhase } from "./types";

export const CONFIG_FILE_NAME = "zen-editor.json";
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
  idle: ["⠃", "⠞", "⡵", "⠿", "⢹", "⠄"],
  outputting: ["⠋", "⠙", "⠸", "⠴", "⠦", "⠇", "⠏"],
  thinking: ["󰌶", "󰌶", "󰌶", "󰌶", "󰌵", "󰌵", "󰌵", "󰌵"],
  toolcall: ["●", "●", "●", "●", "○", "○", "○", "○"],
  exec: ["⠂", "⠅", "⠍", "⠟", "⠿", "⠽", "⠿", "⠟", "⠍", "⠅", "⠂"],

  // Sample ["░", "▒", "▓", "█", "▓", "▒"],
};
/** Nerd Font defaults (override any subset via `frame.icons`). */
export const DEFAULT_ICONS: FrameIcons = {
  model: "\uee9c", // fa-brain
  folder: "\uf07c", //  fa-folder_open
  context: "\uf49b", //  oct-cache
  gitDirty: "\uec0c", //  cod-git_pull_request_new_changes
  thinking: "\uf400", // oct-light_bulb
  gitBranch: "\uf126", //  fa-code-branch
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
  accentColor: "accent",

  header: {
    enable: false,
    logoColor: "text",
    accentColor: "accent",

    heading: "Zen Pi",
    subheading: "A pi-coding-agent powered terminal editor",

    logo: [
      "",
      "█████████  ",
      "███   ███  ",
      "██████     ",
      "███     ███",
      "███     ███",
      "",
    ],
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
    marginBottom: 0,
    showModel: true,
    showThinking: true,
    showContext: true,
    showCwd: true,
    showAgentMode: true,
    showVimMode: true,
    icons: {},
    borderColor: "text",
  },
};

export const THEME_COLORS: Record<ThemeColor, true> = {
  accent: true,
  border: true,
  borderAccent: true,
  borderMuted: true,
  success: true,
  error: true,
  warning: true,
  muted: true,
  dim: true,
  text: true,
  thinkingText: true,
  userMessageText: true,
  customMessageText: true,
  customMessageLabel: true,
  toolTitle: true,
  toolOutput: true,
  mdHeading: true,
  mdLink: true,
  mdLinkUrl: true,
  mdCode: true,
  mdCodeBlock: true,
  mdCodeBlockBorder: true,
  mdQuote: true,
  mdQuoteBorder: true,
  mdHr: true,
  mdListBullet: true,
  toolDiffAdded: true,
  toolDiffRemoved: true,
  toolDiffContext: true,
  syntaxComment: true,
  syntaxKeyword: true,
  syntaxFunction: true,
  syntaxVariable: true,
  syntaxString: true,
  syntaxNumber: true,
  syntaxType: true,
  syntaxOperator: true,
  syntaxPunctuation: true,
  thinkingOff: true,
  thinkingMinimal: true,
  thinkingLow: true,
  thinkingMedium: true,
  thinkingHigh: true,
  thinkingXhigh: true,
  thinkingMax: true,
  bashMode: true,
};

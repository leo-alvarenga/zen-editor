import type {
  ThemeColor,
  WidgetPlacement,
} from "@earendil-works/pi-coding-agent";

/** Vim editing mode. */
export type Mode = "normal" | "insert" | "visual";

/** Streaming phase used to drive the status-animation spinner. */
export type SpinnerPhase = "thinking" | "outputting" | "toolcall" | "exec";

/** Nerd-font / glyph icons shown in the frame border. Each is overridable. */
export interface FrameIcons {
  model: string;
  thinking: string;
  context: string;
  folder: string;
}

/**
 * ``frame`` — the rounded-corner shell look. Padding values are plain
 * numbers (>= 0): paddingTop/paddingBottom are blank lines shown *inside*
 * the box above/below the content.
 */
export interface FrameSettings {
  enable?: boolean;

  /** Below this terminal width the frame is skipped entirely (passthrough) */
  minWidth?: number;

  /** Blank lines inside the box above the content. Default 1. */
  paddingTop?: number;

  /** Blank lines inside the box below the content. Default 1. */
  paddingBottom?: number;

  /** Horizontal inner padding for the content rows. Default 1. */
  paddingX?: number;

  /** Blank rows OUTSIDE the box, above its top border. Default 0. */
  marginTop?: number;

  /** Blank rows OUTSIDE the box, below its bottom border. Default 0. */
  marginBottom?: number;

  showCwd?: boolean;
  showModel?: boolean;
  showContext?: boolean;
  showVimMode?: boolean;
  showThinking?: boolean;
  showAgentMode?: boolean;
  icons?: Partial<FrameIcons>;
}

export interface VimSettings {
  /** Enable minimal visual mode (`v` to select, `d` to delete). Default true. */
  visualMode?: boolean;
}

export interface WidgetModeSettings {
  label?: string;
  icon?: string;
  color?: ThemeColor;
}

export interface WidgetSettings {
  enable?: boolean;
  placement?: WidgetPlacement;
  modes?: Partial<Record<Mode, WidgetModeSettings>>;
}

export interface Settings {
  vim?: VimSettings;
  widget?: WidgetSettings;
  frame?: FrameSettings;
}

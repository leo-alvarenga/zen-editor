import type { ThemeColor } from "@earendil-works/pi-coding-agent";

/** Vim editing mode. */
export type Mode = "normal" | "insert" | "visual";

/** Streaming phase used to drive the status-animation spinner. */
export type SpinnerPhase =
  "thinking" | "outputting" | "toolcall" | "exec" | "idle";

export interface FrameColors {
  border: ThemeColor;
  background: ThemeColor;
  cwd: ThemeColor;
  model: ThemeColor;
  context: ThemeColor;
  thinking: ThemeColor;
  vimMode: ThemeColor;
  agentMode: ThemeColor;
}

/** Nerd-font / glyph icons shown in the frame border. Each is overridable. */
export interface FrameIcons {
  folder: string;
  model: string;
  context: string;
  thinking: string;
  gitDirty: string;
  gitBranch: string;
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
  colors?: Partial<FrameColors>;

  /** ThemeColor used as the fg for all editor border characters. Default "border". */
  borderColor?: ThemeColor;
}

/** `header` — the top-line header, which can show a logo or other text */
export interface HeaderSettings {
  logo: string[];
  enable: boolean;
  heading: string;
  subheading: string;
  logoColor: ThemeColor;
  accentColor: ThemeColor;
}

export interface VimSettings {
  /** Enable minimal visual mode (`v` to select, `d` to delete). Default true. */
  visualMode?: boolean;
}

export interface Settings {
  vim?: VimSettings;
  frame?: FrameSettings;
  header?: HeaderSettings;

  /** Accent color for the frame border and other highlights; Defaults to 'accent' */
  accentColor?: ThemeColor;
}

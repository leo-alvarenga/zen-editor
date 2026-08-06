import type { TUI } from "@earendil-works/pi-tui";
import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";
import type {
  ExtensionAPI,
  Theme,
  ThemeColor,
} from "@earendil-works/pi-coding-agent";

import { DEFAULT_ICONS, DEFAULT_SETTINGS } from "../config/constants";
import type { Settings } from "../config/types";
import { fitFrameRow } from "./frame";
import { getShortCwd } from "../utils";

/** Below which terminal width the box is skipped (borders + env line). */
const MIN_BOX_WIDTH = 20;

/** Live env snapshot the header renders in the muted line. */
export interface HeaderEnv {
  gitBranch: string | undefined;
  gitDirty: number;
  cwd: string;
  /** Combined display name, e.g. `"Model (Provider)"` (provider embedded). */
  modelName: string | undefined;
  thinkingLevel: string | undefined;
}

export function createHeader(
  _tui: TUI,
  theme: Theme,
  pi: ExtensionAPI,
  settings: Settings,
  getEnv: (pi: ExtensionAPI) => HeaderEnv,
) {
  if (!settings.header?.enable) {
    return {
      render(): string[] {
        return [];
      },

      invalidate() {},
    };
  }

  const accentColor =
    settings.header?.accentColor ?? settings.accentColor ?? "accent";

  const logo = {
    lines: settings.header?.logo ?? DEFAULT_SETTINGS.header?.logo ?? [],
    color: settings.header?.logoColor ?? DEFAULT_SETTINGS.header?.logoColor,
  };

  const text = {
    heading: theme.bold(
      theme.italic(
        theme.fg(
          "muted",
          settings.header?.heading ?? DEFAULT_SETTINGS.header?.heading,
        ),
      ),
    ),

    subheading: theme.italic(
      theme.fg(
        "muted",
        settings.header?.subheading ?? DEFAULT_SETTINGS.header?.subheading,
      ),
    ),
  };

  const border = (s: string, fg?: ThemeColor) => theme.fg(fg ?? accentColor, s);

  /** Space-pad `text` so it sits horizontally centered within `inner` cols. */
  function center(text: string, inner: number): string {
    const w = visibleWidth(text);
    const left = Math.max(0, Math.floor((inner - w) / 2));
    const right = Math.max(0, inner - w - left);

    return " ".repeat(left) + text + " ".repeat(right);
  }

  /** One centered content row: │ centered(text) │, exactly `width` cols. */
  function contentRow(
    width: number,
    text: string,
    fg?: ThemeColor,
    italic?: boolean,
    bold?: boolean,
  ): string {
    const inner = Math.max(0, width - 2);
    let content = truncateToWidth(text, inner, "");

    if (italic) content = theme.italic(content);
    if (bold) content = theme.bold(content);
    if (fg) content = theme.fg(fg, content);

    return border("│") + center(content, inner) + border("│");
  }

  /** The muted env line: git + cwd + model(+provider) + thinking. */
  function envRow(width: number, env: HeaderEnv): string {
    const icons = DEFAULT_ICONS;
    const parts: string[] = [];

    if (env.gitBranch) {
      parts.push(theme.fg(accentColor, `${icons.gitBranch} ${env.gitBranch}`));

      if (env.gitDirty > 0) {
        parts.push(theme.fg("error", `${icons.gitDirty} ${env.gitDirty}`));
      }
    }
    if (env.cwd) {
      parts.push(theme.fg("muted", `${icons.folder} ${getShortCwd(env.cwd)}`));
    }

    if (env.modelName) {
      parts.push(theme.fg("muted", env.modelName));
    }

    if (env.thinkingLevel) {
      parts.push(theme.fg("muted", `${icons.thinking} ${env.thinkingLevel}`));
    }

    const inner = Math.max(0, width - 2);
    const body = "  " + (parts.length ? parts.join(" · ") : "");
    const t = truncateToWidth(body, inner, "");

    return border("│") + truncateToWidth(t, inner, "", true) + border("│");
  }

  return {
    render(width: number): string[] {
      const inner = Math.max(0, width - 2);

      // Too narrow for a box → fall back to a plain centered logo.
      if (width < MIN_BOX_WIDTH) {
        return [...logo.lines, text.heading, text.subheading];
      }

      const lines: string[] = [];

      lines.push(fitFrameRow("╭", "╮", "", "", width, border));
      lines.push(contentRow(width, ""));

      for (const logoLine of logo.lines) {
        lines.push(contentRow(width, logoLine, logo.color));
      }

      lines.push(contentRow(width, text.heading));
      lines.push(contentRow(width, text.subheading));

      lines.push(contentRow(width, ""));

      // Single ─ separator line.
      lines.push(border("├" + "─".repeat(inner) + "┤"));

      // Muted env line.
      lines.push(envRow(width, getEnv(pi)));

      lines.push(fitFrameRow("╰", "╯", "", "", width, border));

      return lines;
    },
    invalidate() {},
  };
}

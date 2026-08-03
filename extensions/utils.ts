import { Theme } from "@earendil-works/pi-coding-agent";
import { DEFAULT_SETTINGS, NAVIGATION_ARROWS } from "./contants";
import { Mode, WidgetSettings } from "./types";

/**
 * Vim-style movement handler. Returns an array of ANSI escape sequences for the given input
 * @param input - The input string to parse (e.g., "3j" for moving down 3 lines)
 * @returns An array of ANSI escape sequences corresponding to the movement
 */
export function move(input: string, countBuffer = "1"): string[] {
  try {
    if (input.length > 1) {
      return [input];
    }

    let count = parseInt(countBuffer, 10);
    if (isNaN(count) || count < 1) count = 1;

    return Array(count).fill(NAVIGATION_ARROWS[input] || "");
  } catch {
    return [];
  }
}

/**
 * Checks if the given character is a digit (0-9)
 * @param char - The character to check
 * @returns True if the character is a digit, false otherwise
 */
export function isDigit(char: string): boolean {
  return char >= "0" && char <= "9";
}

export function getDefaultWidget(
  mode: Mode,
  theme: Theme,
  widget: WidgetSettings,
): string[] {
  if (!widget.enable) return [];
  const config = widget.modes?.[mode] ?? { label: mode, color: "accent" };

  const label = theme.bold(` ${config.icon ?? ""} ${config.label} `);

  let pill: string;
  try {
    pill = theme.bg("selectedBg", theme.fg(config.color ?? "accent", label));
  } catch {
    pill = theme.bg("selectedBg", theme.fg("accent", label));
  }

  return [pill];
}

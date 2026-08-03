import type { Theme } from "@earendil-works/pi-coding-agent";

import type { Mode, WidgetSettings } from "../config/types";

/** The optional mode pill widget shown above the editor (offscreen of the
 *  frame). Only rendered when the widget is enabled in config. */
export function getModeWidget(
  mode: Mode,
  theme: Theme,
  widget: WidgetSettings,
): string[] {
  if (!widget.enable) return [];
  const config = widget.modes?.[mode] ?? { label: mode, color: "accent" };
  const label = theme.bold(` ${config.icon ?? ""} ${config.label} `);
  try {
    return [theme.bg("selectedBg", theme.fg(config.color ?? "accent", label))];
  } catch {
    return [theme.bg("selectedBg", theme.fg("accent", label))];
  }
}

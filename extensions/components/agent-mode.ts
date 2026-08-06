import { capitalize } from "../utils";
import type { SegmentDef } from "./types";

/** Top-right: the current Agent Mode from pi-mode-manager (when installed).
 *  Rendered as a pill using the mode's own color/icon. */
export const agentModeSegment: SegmentDef = {
  id: "agent-mode",
  slot: "topRight",
  enabled: (_d, cfg) => cfg.showAgentMode !== false,

  render: (d, { theme }) => {
    const m = d.agentMode;
    if (!m) return "";

    const color = m.color ?? d.accentColor;
    const label = theme.bold(` ${m.icon ?? "◆"} ${capitalize(m.name)} `);

    try {
      return theme.fg(color, label);
    } catch {
      return theme.fg(d.accentColor, label);
    }
  },
};

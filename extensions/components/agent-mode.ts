import type { SegmentDef } from "./types";

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Top-right: the current Agent Mode from pi-mode-manager (when installed).
 *  Rendered as a pill using the mode's own color/icon. */
export const agentModeSegment: SegmentDef = {
  id: "agent-mode",
  slot: "topRight",
  enabled: (_d, cfg) => cfg.showAgentMode !== false,

  render: (d, { theme }) => {
    const m = d.agentMode;
    if (!m) return "";

    const color = m.color ?? "accent";
    const label = theme.bold(` ${m.icon ?? "◆"} ${capitalize(m.name)} `);

    try {
      return theme.fg(color, label);
    } catch {
      return theme.fg("accent", label);
    }
  },
};

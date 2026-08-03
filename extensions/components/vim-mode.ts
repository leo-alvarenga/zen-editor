import type { SegmentDef } from "./types";

const MODE_COLOR: Record<string, string> = {
  normal: "success",
  insert: "accent",
  visual: "warning",
};

/** Top-right: the active vim mode + any pending count (e.g. `NORMAL 3j`). */
export const vimModeSegment: SegmentDef = {
  id: "vim-mode",
  slot: "topRight",
  enabled: (_d, cfg) => cfg.showVimMode !== false,

  render: (d, { theme }) => {
    const color = MODE_COLOR[d.mode] ?? "accent";
    const label = ` ${d.mode.toUpperCase()}${d.count ? ` ${d.count}` : ""} `;

    return theme.fg(color as never, label);
  },
};

import type { SegmentDef } from "./types";

/** Top-left: the active model name. */
export const modelSegment: SegmentDef = {
  id: "model",
  slot: "topLeft",
  enabled: (_d, cfg) => cfg.showModel !== false,
  render: (d, { theme, icons }) => {
    if (!d.modelName) return "";

    return theme.fg("accent", ` ${icons.model} ${d.modelName} `);
  },
};

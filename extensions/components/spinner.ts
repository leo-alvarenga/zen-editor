import type { SegmentDef } from "./types";

/** Status animation. When a phase is active it REPLACES the top-left slot
 *  (model + reasoning) until the phase ends. */
export const spinnerSegment: SegmentDef = {
  id: "spinner",
  slot: "topLeft",
  replaces: true,
  enabled: (d) => d.spinnerPhase !== null,
  render: (d, { theme }) => {
    const phase = d.spinnerPhase ?? "thinking";

    return (
      theme.fg("accent", ` ${d.spinnerFrame} `) + theme.fg("muted", `${phase} `)
    );
  },
};

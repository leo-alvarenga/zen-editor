import type { SegmentDef } from "./types";

/** Status animation. When a phase is active it REPLACES the top-left slot
 *  (model + reasoning) until the phase ends. */
export const spinnerSegment: SegmentDef = {
  id: "spinner",
  slot: "topLeft",
  enabled: (d) => d.spinnerPhase !== null && d.spinnerPhase !== "idle",
  render: (d, { theme }) => {
    let phase = d.spinnerPhase ?? "thinking";

    const spinner = theme.fg("accent", ` ${d.spinnerFrame} `);
    if (phase === "idle") return spinner;

    return spinner + theme.fg("muted", `${phase} `);
  },
};

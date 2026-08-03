import { basename } from "node:path";

import type { SegmentDef } from "./types";

/** Bottom-right: working directory + git branch (with dirty count). */
export const cwdSegment: SegmentDef = {
  id: "cwd",
  slot: "bottomRight",
  enabled: (_d, cfg) => cfg.showCwd !== false,
  render: (d, { theme, icons }) => {
    const folder = basename(d.cwd) || d.cwd;
    let text = theme.fg("muted", `${icons.folder} ${folder}`);

    if (d.gitBranch) {
      let git = ` ${d.gitBranch}`;
      if (d.gitDirty > 0) git += ` +${d.gitDirty}`;

      text += theme.fg("accent", git);
    }

    return ` ${text} `;
  },
};

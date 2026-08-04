import { homedir } from "os";
import { basename } from "node:path";

import type { SegmentDef } from "./types";

function getShortCwd(cwd: string): string {
  const home = homedir();

  let path = cwd.replace(home, "~");
  const subpathCount = path.match(/\//gm)?.length ?? 0;

  if (subpathCount > 3) {
    path = basename(path);
  }

  return path;
}

/** Bottom-right: working directory + git branch (with dirty count). */
export const cwdSegment: SegmentDef = {
  id: "cwd",
  slot: "bottomRight",
  enabled: (_d, cfg) => cfg.showCwd !== false,
  render: (d, { theme, icons }) => {
    const folder = getShortCwd(d.cwd);

    let text = theme.fg("muted", `${icons.folder} ${folder}`);

    if (d.gitBranch) {
      let git = ` ${icons.gitBranch} ${d.gitBranch}`;
      text += theme.fg("accent", git);

      if (d.gitDirty > 0) {
        text += theme.fg("error", ` ${icons.gitDirty} ${d.gitDirty}`);
      }
    }

    return ` ${text} `;
  },
};

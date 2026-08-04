import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { getAgentDir } from "@earendil-works/pi-coding-agent";

import { CONFIG_FILE_NAME, DEFAULT_SETTINGS } from "./constants";
import { Settings } from "./types";

function getResolvedSettingsFilePath(): string {
  return join(getAgentDir(), CONFIG_FILE_NAME);
}

function loadSettingsFile(): Promise<string> {
  return readFile(getResolvedSettingsFilePath(), "utf8");
}

/** Validate a raw (possibly malformed) config against the schema shapes. */
function normalize(raw: unknown): Settings {
  if (!raw || typeof raw !== "object") return DEFAULT_SETTINGS;

  const d = DEFAULT_SETTINGS;
  const r = raw as Record<string, unknown>;
  const out: Settings = {
    ...DEFAULT_SETTINGS,
    frame: { ...DEFAULT_SETTINGS.frame },
  };

  const vimSrc =
    typeof r.vim === "object" && r.vim
      ? (r.vim as Record<string, unknown>)
      : {};

  out.vim = {
    visualMode:
      typeof vimSrc.visualMode === "boolean"
        ? vimSrc.visualMode
        : d.vim?.visualMode,
  };

  if (typeof r.frame === "object" && r.frame) {
    const f = r.frame as Record<string, unknown>;

    const num = (v: unknown, fallback: number): number =>
      typeof v === "number" && Number.isFinite(v) && v >= 0
        ? Math.floor(v)
        : fallback;

    const bool = (v: unknown, fallback: boolean | undefined): boolean =>
      typeof v === "boolean" ? v : (fallback ?? true);

    out.frame = {
      enable: bool(f.enable, d.frame?.enable),
      minWidth: num(f.minWidth, d.frame?.minWidth ?? 20),
      paddingTop: num(f.paddingTop, d.frame?.paddingTop ?? 1),
      paddingBottom: num(f.paddingBottom, d.frame?.paddingBottom ?? 1),
      paddingX: num(f.paddingX, d.frame?.paddingX ?? 1),
      marginTop: num(f.marginTop, d.frame?.marginTop ?? 0),
      marginBottom: num(f.marginBottom, d.frame?.marginBottom ?? 0),
      showModel: bool(f.showModel, d.frame?.showModel),
      showThinking: bool(f.showThinking, d.frame?.showThinking),
      showContext: bool(f.showContext, d.frame?.showContext),
      showCwd: bool(f.showCwd, d.frame?.showCwd),
      showAgentMode: bool(f.showAgentMode, d.frame?.showAgentMode),
      showVimMode: bool(f.showVimMode, d.frame?.showVimMode),
      icons:
        typeof f.icons === "object" && f.icons
          ? { ...d.frame?.icons, ...(f.icons as Record<string, unknown>) }
          : d.frame?.icons,
    };
  }

  return out;
}

export async function loadSettings(): Promise<Settings> {
  try {
    const raw = JSON.parse(await loadSettingsFile()) as unknown;
    return normalize(raw);
  } catch {
    return DEFAULT_SETTINGS;
  }
}

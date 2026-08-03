import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { getAgentDir } from "@earendil-works/pi-coding-agent";

import { CONFIG_FILE_NAME, DEFAULT_SETTINGS } from "./contants";
import { Settings } from "./types";

function getResolvedSettingsFilePath(): string {
  return join(getAgentDir(), CONFIG_FILE_NAME);
}

function loadSettingsFile(): Promise<string> {
  const filePath = getResolvedSettingsFilePath();
  return readFile(filePath, "utf8");
}

export async function loadSettings(): Promise<Settings> {
  let raw: string;
  let parsed: Settings;

  try {
    raw = await loadSettingsFile();
    parsed = JSON.parse(raw) as Settings;

    if (!parsed) {
      return DEFAULT_SETTINGS;
    }

    if ("editor" in parsed && typeof parsed.editor === "object") {
      if (
        "enableBadge" in parsed.editor &&
        typeof parsed.editor.enableBadge !== "boolean"
      ) {
        throw new Error("Invalid type for editor.enableBadge");
      }
    }

    if ("widget" in parsed && typeof parsed.widget === "object") {
      if (
        "enable" in parsed.widget &&
        typeof parsed.widget.enable !== "boolean"
      ) {
        throw new Error("Invalid type for widget.enable");
      }

      if (
        "placement" in parsed.widget &&
        typeof parsed.widget.placement !== "string"
      ) {
        throw new Error("Invalid type for widget.placement");
      }

      if ("modes" in parsed.widget && typeof parsed.widget.modes !== "object") {
        throw new Error("Invalid type for widget.modes");
      }
    }

    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

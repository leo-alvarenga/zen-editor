/**
 * Domain: agent-mode (pi-mode-manager) integration.
 * Optional — no hard dependency on the manager.
 */
import type {
  ExtensionContext,
  ThemeColor,
} from "@earendil-works/pi-coding-agent";

import { PI_MODE_MANAGER_MODE_DATA_KEY } from "../config/constants";

/** Agent-mode state surfaced by pi-mode-manager. */
export type AgentMode = {
  name: string;
  icon?: string;
  color?: ThemeColor;
} | null;

/** Walk the session branch (newest first) for the latest pi-mode-manager mode
 *  entry. Returns null when the manager is absent or nothing is found. */
export function readAgentModeFromSession(ctx: ExtensionContext): AgentMode {
  try {
    const entries = [...ctx.sessionManager.getBranch()].reverse();
    for (const entry of entries) {
      const e = entry as { type?: string; customType?: string; data?: unknown };
      if (e.type !== "custom" || e.customType !== PI_MODE_MANAGER_MODE_DATA_KEY)
        continue;
      const state = e.data as
        | {
            currentModeConfig?: {
              name?: string;
              icon?: string;
              color?: ThemeColor;
            };
          }
        | undefined;
      if (state?.currentModeConfig?.name) {
        return {
          name: state.currentModeConfig.name,
          icon: state.currentModeConfig.icon,
          color: state.currentModeConfig.color,
        };
      }
    }
  } catch {
    // pi-mode-manager absent or session unreadable — silently stay unknown.
  }

  return null;
}
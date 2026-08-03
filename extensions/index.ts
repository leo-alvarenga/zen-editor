/**
 * zen-editor entry. Thin wiring layer:
 *   - loads config, subscribes to pi lifecycle + mode/agent-mode events
 *   - installs VimEditor via setEditorComponent (factory is re-run on model
 *     switch — the old instance's spinner timer is stopped first)
 *   - assembles ExternalData per paint (model, thinking, context, git, ...)
 *
 * All appearance logic lives in components/ (segments + frame); all editor
 * behavior lives in vim/. Nothing here renders anything.
 */
import { execFileSync } from "node:child_process";

import type { ExtensionAPI, ExtensionContext, ThemeColor } from "@earendil-works/pi-coding-agent";

import {
  DEFAULT_SETTINGS,
  DEFAULT_WIDGET_KEY,
  MODE_CHANGE_EVENT_KEY,
  PI_MODE_MANAGER_MODE_DATA_KEY,
  PI_MODE_MANAGER_MODE_EVENT,
} from "./config/constants";
import { loadSettings } from "./config/settings";
import type { Mode, Settings, SpinnerPhase } from "./config/types";
import { getModeWidget } from "./components/widget";
import type { ExternalData } from "./components/types";
import { VimEditor } from "./vim/vim-editor";

type AgentModeState = ExternalData["agentMode"];

let editor: VimEditor | null = null;
let currentCtx: ExtensionContext | null = null;
let settings: Settings = DEFAULT_SETTINGS;
let mode: Mode = "insert";
let spinnerPhase: SpinnerPhase | null = null;
let agentMode: AgentModeState = null;
let git: { branch: string | undefined; dirty: number } = { branch: undefined, dirty: 0 };

// ── data sources ─────────────────────────────────────────────────────────

function readAgentModeFromSession(ctx: ExtensionContext): void {
  try {
    const entries = [...ctx.sessionManager.getBranch()].reverse();
    for (const entry of entries) {
      const e = entry as { type?: string; customType?: string; data?: unknown };
      if (e.type !== "custom" || e.customType !== PI_MODE_MANAGER_MODE_DATA_KEY) continue;
      const state = e.data as
        | { currentModeConfig?: { name?: string; icon?: string; color?: ThemeColor } }
        | undefined;
      if (state?.currentModeConfig?.name) {
        agentMode = {
          name: state.currentModeConfig.name,
          icon: state.currentModeConfig.icon,
          color: state.currentModeConfig.color,
        };
        return;
      }
    }
  } catch {
    // pi-mode-manager absent or session unreadable — silently stay unknown.
  }
}

function readGit(cwd: string): { branch: string | undefined; dirty: number } {
  try {
    const branch = execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 2000,
    }).trim();
    const status = execFileSync("git", ["status", "--porcelain"], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 2000,
    });
    const dirty = status.split("\n").filter((l) => l.trim() !== "").length;
    return { branch: branch || undefined, dirty };
  } catch {
    return { branch: undefined, dirty: 0 };
  }
}

function provideExternal(): ExternalData {
  const ctx = currentCtx;
  const usage = ctx?.getContextUsage?.();
  const model = ctx?.model as { name?: string; id?: string } | undefined;
  return {
    modelName: model?.name ?? model?.id,
    thinkingLevel: ctx?.thinkingLevel as string | undefined,
    spinnerPhase,
    context: usage
      ? { tokens: usage.tokens, window: usage.contextWindow, percent: usage.percent }
      : null,
    cwd: ctx?.cwd ?? "",
    gitBranch: git.branch,
    gitDirty: git.dirty,
    agentMode,
    theme: ctx?.ui.theme,
  };
}

function setSpinner(phase: SpinnerPhase | null): void {
  if (spinnerPhase === phase) return;
  spinnerPhase = phase;
  editor?.setSpinner(phase);
}

// ── extension entry ──────────────────────────────────────────────────────

export default async function (pi: ExtensionAPI) {
  settings = await loadSettings();

  pi.events.on(MODE_CHANGE_EVENT_KEY, (event) => {
    if (event && typeof event === "object" && "mode" in event) {
      mode = (event as { mode: Mode }).mode;
      drawWidget();
    }
  });

  // Optional pi-mode-manager integration (no hard dependency).
  pi.events.on(PI_MODE_MANAGER_MODE_EVENT, (event) => {
    const state = event as
      | { currentMode?: string; currentModeConfig?: { name?: string; icon?: string; color?: ThemeColor } }
      | undefined;
    if (state?.currentModeConfig?.name) {
      agentMode = {
        name: state.currentModeConfig.name,
        icon: state.currentModeConfig.icon,
        color: state.currentModeConfig.color,
      };
    } else if (state?.currentMode) {
      agentMode = { name: state.currentMode };
    }
    editor?.refresh();
  });

  pi.on("session_start", async (_event, ctx) => {
    currentCtx = ctx;
    readAgentModeFromSession(ctx);
    git = readGit(ctx.cwd);

    ctx.ui.setEditorComponent((...args) => {
      editor?.stopSpinner();
      editor = new VimEditor(
        pi,
        provideExternal,
        {
          frame: settings.frame ?? DEFAULT_SETTINGS.frame!,
          visualMode: settings.vim?.visualMode ?? true,
        },
        ...args,
      );
      return editor;
    });

    drawWidget();
  });

  pi.on("session_shutdown", () => {
    editor?.stopSpinner();
    editor = null;
    currentCtx = null;
    spinnerPhase = null;
  });

  // Spinner phase mapping.
  pi.on("turn_start", () => setSpinner("thinking"));
  pi.on("message_update", (event) => {
    const type = (event as { assistantMessageEvent?: { type?: string } })
      .assistantMessageEvent?.type;
    if (typeof type === "string") {
      if (type.startsWith("text_")) setSpinner("outputting");
      else if (type.startsWith("thinking_")) setSpinner("thinking");
      else if (type.startsWith("toolcall_")) setSpinner("toolcall");
    }
  });
  pi.on("tool_execution_start", () => setSpinner("exec"));
  pi.on("agent_end", () => setSpinner(null));

  function drawWidget(): void {
    if (!currentCtx || !settings.widget?.enable) return;
    currentCtx.ui.setWidget(
      DEFAULT_WIDGET_KEY,
      getModeWidget(mode, currentCtx.ui.theme, settings.widget),
      { placement: settings.widget.placement },
    );
  }
}

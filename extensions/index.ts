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
import type {
  ExtensionAPI,
  ExtensionContext,
  ThemeColor,
} from "@earendil-works/pi-coding-agent";

import {
  DEFAULT_SETTINGS,
  PI_MODE_MANAGER_MODE_EVENT,
  SPINNER_FRAMES,
} from "./config/constants";
import { loadSettings } from "./config/settings";
import type { Settings, SpinnerPhase } from "./config/types";
import type { ExternalData } from "./components/types";
import { VimEditor } from "./vim/vim-editor";
import {
  capitalize,
  readAgentModeFromSession,
  readGit,
  type GitInfo,
} from "./utils";
import { createHeader, type HeaderEnv } from "./components/header";

type AgentModeState = ExternalData["agentMode"];

let editor: VimEditor | null = null;
let currentCtx: ExtensionContext | null = null;
let settings: Settings = DEFAULT_SETTINGS;
let spinnerPhase: SpinnerPhase | null = null;
let agentMode: AgentModeState = null;
let git: GitInfo = {
  branch: undefined,
  dirty: 0,
};

// ── data sources ─────────────────────────────────────────────────────────
//

/** Live env snapshot for the header's muted line. Reads current git/ctx so
 *  model switches are reflected on the next render. */
function getHeaderEnv(pi: ExtensionAPI): HeaderEnv {
  return {
    gitDirty: git.dirty,
    gitBranch: git.branch,
    cwd: currentCtx?.cwd ?? "",
    modelName: provideExternal(pi).modelName,
    thinkingLevel: currentCtx?.thinkingLevel as string | undefined,
  };
}

function provideExternal(pi: ExtensionAPI): ExternalData {
  const ctx = currentCtx;
  const usage = ctx?.getContextUsage?.();
  const model = ctx?.model;

  return {
    modelName: `${model?.name ?? model?.id ?? "Unknown"} (${capitalize(model?.provider ?? "unknown")})`,
    thinkingLevel: pi.getThinkingLevel(),
    spinnerPhase,
    context: usage
      ? {
          tokens: usage.tokens,
          window: usage.contextWindow,
          percent: usage.percent,
        }
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

  // Optional pi-mode-manager integration (no hard dependency).
  pi.events.on(PI_MODE_MANAGER_MODE_EVENT, (event) => {
    const state = event as
      | {
          currentMode?: string;
          currentModeConfig?: {
            name?: string;
            icon?: string;
            color?: ThemeColor;
          };
        }
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
    agentMode = readAgentModeFromSession(ctx);

    git = readGit(ctx.cwd);

    ctx.ui.setWorkingIndicator({
      intervalMs: 80,
      frames: SPINNER_FRAMES.outputting,
    });

    if (settings.header?.enable) {
      ctx.ui.setHeader((_tui, theme) =>
        createHeader(_tui, theme, pi, settings, getHeaderEnv),
      );
    }

    ctx.ui.setFooter(() => ({
      render() {
        return [];
      },

      invalidate() {},
    }));

    ctx.ui.setEditorComponent((...args) => {
      editor?.stopSpinner();

      editor = new VimEditor(
        pi,
        provideExternal,
        {
          visualMode: settings.vim?.visualMode ?? true,
          frame: settings.frame ?? DEFAULT_SETTINGS.frame!,
          accentColor:
            settings.accentColor ?? DEFAULT_SETTINGS.accentColor ?? "accent",
        },
        ...args,
      );

      return editor;
    });
  });

  pi.on("session_shutdown", () => {
    editor?.stopSpinner();
    editor = null;
    currentCtx = null;
    spinnerPhase = null;
  });

  // Spinner phases
  pi.on("agent_end", () => setSpinner(null));
  pi.on("turn_start", () => setSpinner("thinking"));
  pi.on("tool_execution_start", () => setSpinner("exec"));

  pi.on("message_update", (event) => {
    const type = event?.assistantMessageEvent?.type;

    if (typeof type !== "string") return;

    if (type.startsWith("text_")) setSpinner("outputting");
    else if (type.startsWith("thinking_")) setSpinner("thinking");
    else if (type.startsWith("toolcall_")) setSpinner("toolcall");
    else setSpinner("idle");
  });
}

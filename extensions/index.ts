import {
  CustomEditor,
  ExtensionContext,
  type ExtensionAPI,
} from "@earendil-works/pi-coding-agent";
import { matchesKey, truncateToWidth } from "@earendil-works/pi-tui";

import {
  DEFAULT_WIDGET_KEY,
  MODE_BY_KEY,
  MODE_CHANGE_EVENT_KEY,
  MOVE_BY_KEY,
} from "./contants";
import { Mode } from "./types";
import { getDefaultWidget, isDigit, move } from "./utils";
import { loadSettings } from "./settings";

class VimEditor extends CustomEditor {
  private pi: ExtensionAPI;
  private enableBadge: boolean;
  private mode: Mode = "insert";
  private countBuffer: string = "";

  constructor(
    pi: ExtensionAPI,
    enableBadge: boolean,
    ...args: ConstructorParameters<typeof CustomEditor>
  ) {
    super(...args);
    this.pi = pi;
    this.enableBadge = enableBadge;
  }

  handleInput(data: string): void {
    if (this.checkModeChange(data)) return;

    if (matchesKey(data, "escape") || this.mode === "insert") {
      super.handleInput(data);
      return;
    }

    if (isDigit(data)) {
      this.countBuffer += data;
      return;
    }

    const moves = move(data, this.countBuffer);

    if (moves.length > 0) {
      moves.forEach((move) => super.handleInput(move));
      this.countBuffer = "";

      return;
    }

    if (data.length === 1 && data.charCodeAt(0) >= 32) return;
    super.handleInput(data);
  }

  render(width: number): string[] {
    const lines = super.render(width);
    if (!this.enableBadge) return lines;

    if (lines.length > 0) {
      const label = ` ${String(this.mode).toUpperCase()} `;
      const lastLine = lines[lines.length - 1]!;

      lines[lines.length - 1] =
        truncateToWidth(lastLine, width - label.length, "") + label;
    }

    return lines;
  }

  private checkModeChange(data: string): boolean {
    if (this.mode === "normal") {
      const newMode = MODE_BY_KEY[data];
      const moveKey = MOVE_BY_KEY[data];

      if (newMode) {
        this.mode = newMode;
        this.triggerModeChangedEvent();

        if (moveKey?.length) {
          super.handleInput(moveKey);
        }

        return true;
      }
    } else if (matchesKey(data, "escape")) {
      this.mode = "normal";
      this.triggerModeChangedEvent();

      return true;
    }

    return false;
  }

  private triggerModeChangedEvent() {
    this.pi.events.emit(MODE_CHANGE_EVENT_KEY, {
      mode: this.mode,
    });
  }
}

export default async function (pi: ExtensionAPI) {
  const settings = await loadSettings();
  let mode: Mode = "insert";
  let ctxObj: ExtensionContext | null = null;

  pi.events.on(MODE_CHANGE_EVENT_KEY, (event) => {
    if (typeof event === "object" && event !== null && "mode" in event) {
      mode = event.mode as Mode;
      drawWidget();
    }
  });

  pi.on("session_start", (_event, ctx) => {
    ctx.ui.setEditorComponent(
      (...args) =>
        new VimEditor(pi, settings?.editor?.enableBadge ?? false, ...args),
    );
    ctxObj = ctx;

    drawWidget();
  });

  function drawWidget() {
    if (!ctxObj || !settings.widget?.enable) return;

    ctxObj.ui.setWidget(
      DEFAULT_WIDGET_KEY,
      getDefaultWidget(mode, ctxObj.ui.theme, settings.widget),
      {
        placement: settings.widget.placement,
      },
    );
  }
}

/**
 * VimEditor — the editor component itself. Subclasses CustomEditor so all of
 * pi's editing/undo/app-keybinding machinery keeps working;
 * `handleInput` layers vim modes on top, `render` layers the box frame.
 *
 * Behavior lives here (mode dispatch + motions); appearance lives in
 * `components/` (segments + frame). Nothing here imports a segment.
 */
import {
  CustomEditor,
  ThemeColor,
  type ExtensionAPI,
} from "@earendil-works/pi-coding-agent";
import { matchesKey } from "@earendil-works/pi-tui";

import {
  DEFAULT_ICONS,
  DELETE_FORWARD_KEY,
  MODE_CHANGE_EVENT_KEY,
  NAVIGATION_ARROWS,
  SPINNER_FRAMES,
} from "../config/constants";
import type { FrameSettings, Mode, SpinnerPhase } from "../config/types";
import { renderFrame } from "../components/frame";
import { segmentsFor } from "../components/registry";
import type {
  ExternalData,
  FrameData,
  SegmentContext,
} from "../components/types";
import {
  clampPos,
  firstNonWhitespace,
  isDigit,
  repeatWord,
  type Pos,
} from "./motions";

export interface VimEditorOptions {
  visualMode: boolean;
  frame: FrameSettings;
  accentColor: ThemeColor;
}

/** Structural view of the base editor's private state (runtime-accessible). */
interface EditorStateLike {
  lines: string[];
  cursorCol: number;
  cursorLine: number;
}

export class VimEditor extends CustomEditor {
  private pi: ExtensionAPI;
  private opts: VimEditorOptions;
  private provider: (pi: ExtensionAPI) => ExternalData;

  private countBuffer = "";
  private gPending = false;
  private mode: Mode = "insert";
  private visualAnchor: Pos | null = null;

  private spinnerIdx = 0;
  private spinnerPhase: SpinnerPhase | null = null;
  private spinnerTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    pi: ExtensionAPI,
    provider: (pi: ExtensionAPI) => ExternalData,
    opts: VimEditorOptions,
    ...args: ConstructorParameters<typeof CustomEditor>
  ) {
    super(...args);

    this.pi = pi;
    this.opts = opts;
    this.provider = provider;
  }

  setSpinner(phase: SpinnerPhase | null): void {
    if (this.spinnerPhase === phase) return;

    this.spinnerIdx = 0;
    this.spinnerPhase = phase;
    this.clearSpinnerTimer();

    if (phase && SPINNER_FRAMES[phase]) {
      const frames = SPINNER_FRAMES[phase];

      this.spinnerTimer = setInterval(() => {
        this.spinnerIdx = (this.spinnerIdx + 1) % frames.length;
        this.tui.requestRender();
      }, 80);
    }

    this.tui.requestRender();
  }

  stopSpinner(): void {
    this.clearSpinnerTimer();
    this.spinnerPhase = null;
  }

  refresh(): void {
    this.tui.requestRender();
  }

  // ── input: vim mode dispatch ───────────────────────────────────────────

  handleInput(data: string): void {
    // `g` prefix (gg / G) works in normal and visual mode.
    if (this.gPending) {
      this.gPending = false;

      if (matchesKey(data, "g")) {
        this.applyPos({ line: 0, col: this.getCursor().col });
      } else if (matchesKey(data, "shift+g")) {
        this.applyPos({
          line: this.getLines().length - 1,
          col: this.getCursor().col,
        });
      }

      return;
    }

    if (this.mode === "insert") {
      if (matchesKey(data, "escape")) {
        if (this.isShowingAutocomplete()) super.handleInput(data); // cancel popup

        this.setMode("normal");
        return;
      }

      super.handleInput(data);
      return;
    }

    // normal + visual share the escape → normal behavior. An open
    // autocomplete popup is canceled by the base editor first.
    if (matchesKey(data, "escape")) {
      if (this.isShowingAutocomplete()) {
        super.handleInput(data);
        return;
      }

      if (this.mode === "visual") this.setMode("normal");
      return; // in normal mode escape is a no-op (never reaches app.interrupt)
    }

    if (this.mode === "normal") {
      if (isDigit(data)) {
        // `0` with no pending count is the line-start motion; after other
        // digits it's a count digit (e.g. `10j`).
        if (data === "0" && this.countBuffer === "") {
          this.applyPos({ line: this.getCursor().line, col: 0 });
          return;
        }

        this.countBuffer += data;
        return;
      }
    }

    if (this.handleMotion(data)) return;

    if (this.mode === "normal") {
      switch (data) {
        case "i":
          this.enterInsert(false);
          return;

        case "a":
          this.enterInsert(true);
          return;

        case "I":
          this.applyPos({
            line: this.getCursor().line,
            col: firstNonWhitespace(
              this.getLines()[this.getCursor().line] ?? "",
            ),
          });

          this.enterInsert(false);
          return;

        case "A":
          this.applyPos({
            line: this.getCursor().line,
            col: (this.getLines()[this.getCursor().line] ?? "").length,
          });

          this.enterInsert(false);
          return;

        case "o":
          this.openLine(false);
          return;

        case "O":
          this.openLine(true);
          return;

        case "x":
          super.handleInput(DELETE_FORWARD_KEY);
          return;

        case "u":
          this.undoEdit();
          return;

        case "v":
          if (this.opts.visualMode) this.enterVisual();
          return;

        default:
          break;
      }
    } else if (this.mode === "visual") {
      switch (data) {
        case "v":
          this.setMode("normal");
          return;

        case "d":
          this.deleteSelection();
          return;

        default:
          break;
      }
    }

    // Swallow other printable keys in normal/visual; pass everything else
    // (arrows, tab, ctrl-*, ...) up to the base editor.
    if (data.length === 1 && data.charCodeAt(0) >= 32) return;

    super.handleInput(data);
  }

  /** Motions shared by normal + visual modes. Returns true if consumed. */
  private handleMotion(data: string): boolean {
    const count = this.count();
    const cur = this.getCursor();
    const lines = this.getLines();

    if (data in NAVIGATION_ARROWS) {
      const key = NAVIGATION_ARROWS[data]!;

      for (let i = 0; i < count; i++) super.handleInput(key);

      this.countBuffer = "";
      return true;
    }

    if (data === "w" || data === "b" || data === "e") {
      const dir = data === "w" ? "next" : data === "b" ? "prev" : "end";

      this.applyPos(repeatWord(lines, cur, dir, count));
      this.countBuffer = "";

      return true;
    }

    if (data === "^") {
      this.applyPos({
        line: cur.line,
        col: firstNonWhitespace(lines[cur.line] ?? ""),
      });

      this.countBuffer = "";

      return true;
    }

    if (data === "$") {
      this.applyPos({ line: cur.line, col: (lines[cur.line] ?? "").length });
      this.countBuffer = "";

      return true;
    }

    if (data === "g") {
      this.gPending = true;
      this.countBuffer = "";

      return true;
    }

    if (data === "G") {
      this.applyPos({ line: lines.length - 1, col: cur.col });
      this.countBuffer = "";

      return true;
    }

    return false;
  }

  // ── mode helpers ───────────────────────────────────────────────────────

  private enterInsert(after: boolean): void {
    if (after) {
      const cur = this.getCursor();

      this.applyPos({
        line: cur.line,
        col: (this.getLines()[cur.line] ?? "").length,
      });
    }

    this.setMode("insert");
  }

  private enterVisual(): void {
    this.visualAnchor = this.getCursor();
    this.setMode("visual");
  }

  private setMode(mode: Mode): void {
    if (this.mode === mode) return;

    this.mode = mode;
    this.countBuffer = "";

    if (mode !== "visual") this.visualAnchor = null;

    this.pi.events.emit(MODE_CHANGE_EVENT_KEY, { mode });
  }

  // ── edits ──────────────────────────────────────────────────────────────

  private openLine(above: boolean): void {
    const i = this.getCursor().line;
    const lines = this.getLines();
    const indent = lines[i]?.match(/^\s*/)?.[0] ?? "";

    this.pushSnapshot();
    this.stateRef.lines.splice(above ? i : i + 1, 0, indent);
    this.applyPos({ line: above ? i : i + 1, col: indent.length });

    this.onChange?.(this.getText());
    this.setMode("insert");
  }

  private deleteSelection(): void {
    const a = this.visualAnchor;

    if (!a) {
      this.setMode("normal");
      return;
    }

    const b = this.getCursor();
    const s = a.line < b.line || (a.line === b.line && a.col <= b.col) ? a : b;
    const e = s === a ? b : a;

    const lines = this.getLines();
    this.pushSnapshot();

    if (s.line === e.line) {
      const line = lines[s.line]!;
      this.stateRef.lines[s.line] = line.slice(0, s.col) + line.slice(e.col);
    } else {
      const first = lines[s.line]!.slice(0, s.col);
      const last = lines[e.line]!.slice(e.col);
      const middle = lines.slice(s.line + 1, e.line).join("");

      this.stateRef.lines.splice(
        s.line,
        e.line - s.line + 1,
        first + middle + last,
      );
    }

    this.visualAnchor = null;
    this.applyPos({ line: s.line, col: s.col });
    this.onChange?.(this.getText());
    this.setMode("normal");
  }

  private undoEdit(): void {
    (this as unknown as { undo(): void })?.undo();
  }

  private pushSnapshot(): void {
    (this as unknown as { pushUndoSnapshot(): void })?.pushUndoSnapshot();
  }

  // ── rendering ──────────────────────────────────────────────────────────

  render(width: number): string[] {
    const frame = this.opts.frame;
    const ext = this.provider(this.pi);

    const d: FrameData = {
      cwd: ext.cwd,
      mode: this.mode,
      context: ext.context,
      gitDirty: ext.gitDirty,
      count: this.countBuffer,
      agentMode: ext.agentMode,
      gitBranch: ext.gitBranch,
      modelName: ext.modelName,
      spinnerPhase: ext.spinnerPhase,
      thinkingLevel: ext.thinkingLevel,
      spinnerFrame: this.spinnerFrame(),
      accentColor: this.opts.accentColor,
    };

    // No theme (non-TUI) or frame disabled or too narrow → plain editor.
    if (!ext.theme || !frame.enable || width < (frame.minWidth ?? 20)) {
      return super.render(width);
    }

    const padX = Math.min(
      frame.paddingX ?? 1,
      Math.max(0, Math.floor((width - 2) / 2)),
    );
    const innerWidth = width - 2 - padX * 2;
    if (innerWidth < 8) return super.render(width);

    const inner = super.render(innerWidth);
    const ctx: SegmentContext = {
      cfg: frame,
      theme: ext.theme,
      border: this.borderColor,
      icons: {
        ...DEFAULT_ICONS,
        ...frame.icons,
      },
    };

    const box = renderFrame(
      inner,
      {
        topLeft: segmentsFor("topLeft", d, ctx),
        topRight: segmentsFor("topRight", d, ctx),
        bottomLeft: segmentsFor("bottomLeft", d, ctx),
        bottomRight: segmentsFor("bottomRight", d, ctx),
      },
      {
        width,
        border: this.borderColor,
        paddingTop: frame.paddingTop ?? 1,
        paddingBottom: frame.paddingBottom ?? 1,
        paddingX: padX,
      },
    );

    // Blank rows OUTSIDE the box, above/below its borders.
    const marginRow = " ".repeat(width);
    const marginTop = Array(Math.max(0, frame.marginTop ?? 0)).fill(marginRow);
    const marginBottom = Array(Math.max(0, frame.marginBottom ?? 0)).fill(
      marginRow,
    );

    return [...marginTop, ...box, ...marginBottom];
  }

  private spinnerFrame(): string {
    if (!this.spinnerPhase) return "";

    const frames = SPINNER_FRAMES[this.spinnerPhase]!;

    return frames[this.spinnerIdx % frames.length]!;
  }

  private count(): number {
    const n = parseInt(this.countBuffer, 10);
    return Number.isFinite(n) && n >= 1 ? n : 1;
  }

  // ── private base-state access (via structural cast; TS-private only) ───

  private get stateRef(): EditorStateLike {
    return (this as unknown as { state: EditorStateLike }).state;
  }

  private applyPos(pos: Pos): void {
    const p = clampPos(this.stateRef.lines, pos);
    this.stateRef.cursorLine = p.line;
    (this as unknown as { setCursorCol(col: number): void }).setCursorCol(
      p.col,
    );
  }

  private clearSpinnerTimer(): void {
    if (this.spinnerTimer) {
      clearInterval(this.spinnerTimer);
      this.spinnerTimer = null;
    }
  }
}

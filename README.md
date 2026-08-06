# zen-editor

A [pi-coding-agent](https://github.com/earendil-works/pi) extension that turns the TUI editor into a polished, Vim‑style editor wrapped in a rounded‑corner `frame`.

- **Frame** — a box (`╭ ╮ ╰ ╯ │ ─`) with live status segments embedded in the top/bottom border.
- **Header** — an optional branded top box (logo, heading, subheading, env line).
- **Vim editing** — normal / insert / visual modes with motions, count suffixes, and edits.
- **Theme‑native** — every color is a pi `ThemeColor`, so it follows your active pi theme.

## Install

It's distributed as a pi package. Add it to `settings.json` → `packages`, e.g. install from
a local checkout or registry:

```jsonc
// ~/.pi/agent/settings.json
{
  "packages": [
    "git:github.com/<you>/zen-editor",
    "path/to/zen-editor"
  ]
}
```

Restart pi (or `/reload`). Editing starts in **insert** mode.

## Config

zen‑editor reads `~/.pi/agent/zen-editor.json`. All keys are optional; defaults are shown.

```jsonc
{
  // Accent used by segments/frame when a more specific color isn't set.
  "accentColor": "accent",

  "header": {
    "enable": true,
    "logo": [" ", "██████████", "███   ███ ", "██████    ", ...],
    "heading": "Zen Pi",
    "subheading": "A pi-coding-agent powered terminal editor",
    "logoColor": "text",
    "accentColor": "customMessageLabel"
  },

  "frame": {
    "enable": true,
    // Below this terminal width the box is skipped (plain editor).
    "minWidth": 20,

    // Blank lines inside the box (padding) / outside it (margin).
    "paddingTop": 1,
    "paddingBottom": 1,
    "paddingX": 1,
    "marginTop": 0,
    "marginBottom": 0,

    // Border segments on/off.
    "showModel": true,
    "showThinking": true,
    "showContext": true,
    "showCwd": true,
    "showAgentMode": true,
    "showVimMode": true,

    // ✨ NEW — ThemeColor used as the foreground for EVERY border character
    // (corner caps, ─ fills, │ side bars, and the base editor's own borders).
    // Defaults to accentColor, then "border".
    "borderColor": "border",

    // Override the Nerd-Font glyphs (folder, model, context, thinking,
    // gitDirty, gitBranch).
    "icons": {}
  },

  "vim": {
    // Minimal visual mode: `v` to select, `d` to delete. Default true.
    "visualMode": true
  }
}
```

## The frame

The editor's content is boxed with rounded‑corner glyphs and two live status rails painted into the top and bottom borders.

### Top border (left)
- **model** — active model name + provider, accented.
- **reasoning** — current thinking level, tinted with pi's own thinking token (`thinkingLow` … `thinkingXhigh`).
- **spinner** — streaming phase (`thinking` / `outputting` / `toolcall` / `exec`), replaces the left slot while active.
- **agent‑mode** — current pi-mode-manager mode as a colored pill (optional, no hard dependency).

### Top border (right)
- **vim‑mode** — `NORMAL` / `INSERT` / `VISUAL` (+ pending count, e.g. `NORMAL 4j`).

### Bottom border (left)
- **ctx** — context window usage: percentage + `used/window` tokens. Color winds traffic‑light (green → warning at ≥50% → red at ≥80%).

### Bottom border (right)
- **cwd** — working directory (shortened) + git branch and dirty‑file count.

All of these are colored with pi `ThemeColor`s, so they follow kanagawa, dark, etc.

## Vim editing

The editor subclasses pi's `CustomEditor`, layering vim behavior over the base editing/undo machinery.

**Modes:** `insert` (start, and after `i`/`a`/`o`) · `normal` (Esc) · `visual` (`v`).

**Motions** (normal + visual):
- `h` `j` `k` `l` — arrows (repeatable with a count: `3j`)
- `w` `b` `e` — word jumps (`w` next, `b` prev, `e` end), count‑aware
- `0` — line start · `^` — first non‑whitespace · `$` — line end
- `gg` — buffer start · `G` — last line

**Editing (normal):**
- `i` insert · `a` insert after line end
- `I` insert at first non‑whitespace · `A` insert at line end
- `o` / `O` — open a new line below / above (preserves indent)
- `x` — delete char forward · `u` — undo
- `v` — enter visual · `d` — delete selection

**Count prefixes** parse digit runs (`10j`), `0` alone means line‑start.

Feeds everything else (arrows, tab, ctrl‑*) up to the base editor (e.g. autocomplete escaping).

## Source layout

```
extensions/
  index.ts            entry: config, events, editor install
  config/             types, constants, settings loading/normalization
  components/         header, frame, segments, registry (one file per segment)
  vim/                VimEditor (modes, motions, edits) + motions helpers
  utils/              agent-mode, git, path, string helpers
```
/** Pure cursor-target math for vim motions. No editor state access here —
 *  every function takes lines + a position and returns a new position.
 */

export interface Pos {
  line: number;
  col: number;
}

export function isWhitespace(ch: string): boolean {
  return /\s/.test(ch);
}

export function clampPos(lines: string[], pos: Pos): Pos {
  const line = Math.max(0, Math.min(lines.length - 1, pos.line));
  const col = Math.max(0, Math.min(lines[line]?.length ?? 0, pos.col));
  return { line, col };
}

export function firstNonWhitespace(line: string): number {
  for (let i = 0; i < line.length; i++) {
    if (!isWhitespace(line[i]!)) return i;
  }
  return line.length;
}

/** `w` — start of the next word (words = runs of non-whitespace). */
export function nextWordStart(lines: string[], line: number, col: number): Pos {
  let l = line;
  let c = col;
  while (l < lines.length) {
    const s = lines[l]!;
    while (c < s.length && !isWhitespace(s[c]!)) c++; // end of current word
    while (c < s.length && isWhitespace(s[c]!)) c++; // skip whitespace
    if (c < s.length) return { line: l, col: c };
    l++;
    c = 0;
  }
  return { line, col }; // no next word — stay put
}

/** `b` — start of the previous word. */
export function prevWordStart(lines: string[], line: number, col: number): Pos {
  let l = line;
  let c = col;
  while (l >= 0) {
    const s = lines[l]!;
    c = l === line ? Math.min(c, s.length) : s.length;
    while (c > 0 && isWhitespace(s[c - 1]!)) c--; // skip whitespace backwards
    while (c > 0 && !isWhitespace(s[c - 1]!)) c--; // skip word backwards
    if (c > 0) return { line: l, col: c };
    if (s.length > 0 && !isWhitespace(s[0]!)) return { line: l, col: 0 };
    l--;
    c = 0;
  }
  return { line, col: 0 }; // top of buffer
}

/** `e` — last character of the next/current word. */
export function wordEnd(lines: string[], line: number, col: number): Pos {
  let l = line;
  let c = col;
  while (l < lines.length) {
    const s = lines[l]!;
    c = l === line ? c : 0;
    while (c < s.length && isWhitespace(s[c]!)) c++; // skip leading whitespace
    if (c >= s.length) {
      l++;
      c = 0;
      continue;
    }
    while (c < s.length && !isWhitespace(s[c]!)) c++; // end of word
    return { line: l, col: Math.max(0, c - 1) };
  }
  return { line, col };
}

/** `w`/`b`/`e` with a repeat count. */
export function repeatWord(
  lines: string[],
  pos: Pos,
  dir: "next" | "prev" | "end",
  count: number,
): Pos {
  let cur = pos;
  for (let i = 0; i < count; i++) {
    const next =
      dir === "next"
        ? nextWordStart(lines, cur.line, cur.col)
        : dir === "prev"
          ? prevWordStart(lines, cur.line, cur.col)
          : wordEnd(lines, cur.line, cur.col);
    if (next.line === cur.line && next.col === cur.col) break; // no movement left
    cur = next;
  }
  return cur;
}

export function isDigit(ch: string): boolean {
  return ch >= "0" && ch <= "9";
}

/** Bold, italic, underline and strikethrough. */
export const STYLE_CODES = [1, 3, 4, 9];

// The codes that turn each style off again.
const STYLE_OFF_CODES: Record<number, number> = { 22: 1, 23: 3, 24: 4, 29: 9 };

export interface ANSIStyle {
  /** The styles that apply together, in the order of STYLE_CODES. */
  st?: number[];
  fg?: number;
  bg?: number;
}

export interface ANSISegment {
  text: string;
  style: ANSIStyle;
}

// biome-ignore lint/suspicious/noControlCharactersInRegex: matches the escape character on purpose
const SGR_RE = /\x1b\[([\d;]*)m/g;

function applyCodes(style: ANSIStyle, params: string): ANSIStyle {
  let next: ANSIStyle = { ...style };
  const codes = params.split(";").map((param) => Number(param || 0));

  function setStyles(st: number[]) {
    if (st.length) next.st = st;
    else delete next.st;
  }

  for (let i = 0; i < codes.length; i++) {
    const code = codes[i];
    if (code === 0) next = {};
    else if (STYLE_CODES.includes(code)) {
      setStyles(STYLE_CODES.filter((c) => c === code || next.st?.includes(c)));
    } else if (code in STYLE_OFF_CODES) {
      setStyles((next.st ?? []).filter((c) => c !== STYLE_OFF_CODES[code]));
    } else if (code === 39) delete next.fg;
    else if (code === 49) delete next.bg;
    else if (code >= 30 && code <= 37) next.fg = code;
    else if (code >= 40 && code <= 47) next.bg = code;
    // Custom colors aren't supported, but their numbers must not be read as codes.
    else if (code === 38 || code === 48) {
      if (codes[i + 1] === 2) i += 4;
      else if (codes[i + 1] === 5) i += 2;
    }
  }
  return next;
}

/**
 * Splits text with ANSI escape codes into styled runs. Only understands the
 * codes Discord renders, which are the ones the colored text tool exports.
 * The ```ansi code block around the text is optional.
 */
export function parseANSI(input: string): ANSISegment[] {
  const body = input
    .replace(/\r\n/g, "\n")
    .replace(/^\s*```ansi\n/, "")
    .replace(/\n?```\s*$/, "");

  const segments: ANSISegment[] = [];
  let style: ANSIStyle = {};
  let last = 0;

  function addText(text: string) {
    if (text) segments.push({ text, style });
  }

  for (const match of body.matchAll(SGR_RE)) {
    addText(body.slice(last, match.index));
    style = applyCodes(style, match[1]);
    last = match.index + match[0].length;
  }
  addText(body.slice(last));

  return segments;
}

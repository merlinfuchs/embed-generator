export interface ANSIStyle {
  /** 1 for bold, 4 for underline. */
  st?: number;
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
  let next = { ...style };
  for (const param of params.split(";")) {
    const code = Number(param || 0);
    if (code === 0) next = {};
    else if (code === 1 || code === 4) next.st = code;
    else if (code >= 30 && code <= 37) next.fg = code;
    else if (code >= 40 && code <= 47) next.bg = code;
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

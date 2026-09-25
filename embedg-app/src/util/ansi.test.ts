import { expect, test } from "vitest";
import { parseANSI } from "./ansi";

test("reads what the colored text tool exports", () => {
  const exported =
    "```ansi\n" +
    "\x1b[2;45mJust select\x1b[0m \x1b[2;34msome text\x1b[0m and " +
    "\x1b[2;31m\x1b[1;31mcolor\x1b[0m\x1b[2;31m\x1b[0m or " +
    "\x1b[4;2mformat\x1b[0m!" +
    "\n```";

  expect(parseANSI(exported)).toEqual([
    { text: "Just select", style: { bg: 45 } },
    { text: " ", style: {} },
    { text: "some text", style: { fg: 34 } },
    { text: " and ", style: {} },
    { text: "color", style: { st: 1, fg: 31 } },
    { text: " or ", style: {} },
    { text: "format", style: { st: 4 } },
    { text: "!", style: {} },
  ]);
});

test("styles carry over until a reset", () => {
  expect(parseANSI("\x1b[44mA\x1b[31mB\x1b[1mC\x1b[mD")).toEqual([
    { text: "A", style: { bg: 44 } },
    { text: "B", style: { fg: 31, bg: 44 } },
    { text: "C", style: { st: 1, fg: 31, bg: 44 } },
    { text: "D", style: {} },
  ]);
});

test("line breaks survive and the code block is optional", () => {
  expect(parseANSI("\x1b[2;32mone\r\ntwo\x1b[0m\n")).toEqual([
    { text: "one\ntwo", style: { fg: 32 } },
    { text: "\n", style: {} },
  ]);
});

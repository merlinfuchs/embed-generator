import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, test } from "vitest";
import {
  DEFAULT_COLORED_TEXT,
  useColoredTextStore,
} from "../state/coloredText";
import { parseANSI } from "../util/ansi";
import ToolsColoredText from "./ToolsColoredText";

beforeEach(() => {
  useColoredTextStore.setState({ text: DEFAULT_COLORED_TEXT });
  localStorage.clear();
});

function renderEditor() {
  render(<ToolsColoredText />);
  return screen.getByRole("textbox", { name: "Colored text" });
}

function storedText() {
  return JSON.parse(localStorage.getItem("colored-text")!).state.text;
}

test("edits are saved as ANSI", () => {
  const editor = renderEditor();
  expect(editor).toHaveTextContent("Just select some text");

  editor.append(" More");
  fireEvent.input(editor);

  const text = storedText();
  expect(text.startsWith("\x1b[2;45mJust select\x1b[0m ")).toBe(true);
  expect(text.endsWith("! More")).toBe(true);
});

test("the saved text is back after a reload", () => {
  useColoredTextStore.setState({ text: "\x1b[2;31mred\x1b[0m\nplain" });

  const editor = renderEditor();

  expect(editor).not.toHaveTextContent("Just select");
  expect(editor.querySelector('[data-ansi="31"]')).toHaveTextContent("red");
  expect(editor.querySelector("br")).not.toBeNull();
  expect(editor).toHaveTextContent("redplain");
});

test("pasting copied colored text brings back the colors", () => {
  const editor = renderEditor();
  const range = document.createRange();
  range.selectNodeContents(editor);
  window.getSelection()!.removeAllRanges();
  window.getSelection()!.addRange(range);

  const copied = "```ansi\n\x1b[2;44m\x1b[1;44mbold on blue\x1b[0m done\n```";
  fireEvent.paste(editor, { clipboardData: { getData: () => copied } });

  const blue = editor.querySelector('[data-ansi="44"]');
  expect(blue?.querySelector('[data-ansi="1"]')).toHaveTextContent(
    "bold on blue",
  );
  expect(editor).toHaveTextContent(/^bold on blue done$/);
  expect(storedText()).toBe(
    "\x1b[2;44m\x1b[1;2mbold on blue\x1b[0m\x1b[2;44m\x1b[0m done",
  );
});

test("pasted plain text keeps its line breaks", () => {
  const editor = renderEditor();
  const range = document.createRange();
  range.selectNodeContents(editor);
  window.getSelection()!.removeAllRanges();
  window.getSelection()!.addRange(range);

  fireEvent.paste(editor, { clipboardData: { getData: () => "one\ntwo" } });

  expect(editor.querySelector("br")).not.toBeNull();
  expect(storedText()).toBe("one\ntwo");
});

test("pasted styles that apply together are kept together", () => {
  const editor = renderEditor();
  const range = document.createRange();
  range.selectNodeContents(editor);
  window.getSelection()!.removeAllRanges();
  window.getSelection()!.addRange(range);

  const copied = "```ansi\n\x1b[1;3;4;9;31mall four\x1b[0m\n```";
  fireEvent.paste(editor, { clipboardData: { getData: () => copied } });

  for (const code of [1, 3, 4, 9, 31]) {
    expect(editor.querySelector(`[data-ansi="${code}"]`)).toHaveTextContent(
      "all four",
    );
  }
  // What's copied reads back as the same style.
  expect(parseANSI(storedText())[0]).toEqual({
    text: "all four",
    style: { st: [1, 3, 4, 9], fg: 31 },
  });
});

test("the preview theme can be switched", () => {
  const editor = renderEditor();
  const root = editor.closest("[data-theme]");
  expect(root).toHaveAttribute("data-theme", "ash");

  fireEvent.click(screen.getByRole("button", { name: "Onyx" }));
  expect(root).toHaveAttribute("data-theme", "onyx");
});

test("every text color, background color and style has a button", () => {
  renderEditor();
  for (const name of [
    "Text color Black",
    "Text color Gray",
    "Background color Gold",
    "Background color Teal",
  ]) {
    expect(screen.getByRole("button", { name })).toBeInTheDocument();
  }
  for (const name of ["Bold", "Italic", "Underline", "Strikethrough"]) {
    expect(screen.getByRole("button", { name })).toBeInTheDocument();
  }
});

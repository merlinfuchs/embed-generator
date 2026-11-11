import clsx from "clsx";
import styles from "./ToolsColoredText.module.css";
import {
  type ClipboardEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { parseANSI } from "../util/ansi";
import {
  type ColoredTextTheme,
  useColoredTextStore,
} from "../state/coloredText";
import SegmentedControl from "./SegmentedControl";

const themes: { value: ColoredTextTheme; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "ash", label: "Ash" },
  { value: "dark", label: "Dark" },
  { value: "onyx", label: "Onyx" },
];

// The names Discord users know these colors by. The backgrounds are the same 8 colors.
const colorNames = [
  "Black",
  "Red",
  "Green",
  "Gold",
  "Blue",
  "Pink",
  "Teal",
  "Gray",
];
export const foregroundColors = colorNames.map((name, i) => ({
  code: 30 + i,
  name,
}));
export const backgroundColors = colorNames.map((name, i) => ({
  code: 40 + i,
  name,
}));

/** Applies the default theme's colors to a list of them outside the tool. */
export const ansiRootClass = styles.root;

export function ansiClass(code: number): string {
  return styles[`ansi${code}`];
}

// 2 stands for no color, like the filler where a style is the only code.
interface State {
  fg: number;
  bg: number;
  /** Bold, italic, underline and strikethrough, which apply together. */
  st: number[];
}

function sgr(state: State, color: number): string {
  return `\x1b[${state.st.length ? state.st.join(";") : 2};${color}m`;
}

function nodesToANSI(nodes: NodeListOf<ChildNode>, states: State[]) {
  let text = "";
  for (const node of nodes) {
    if (node.nodeType === 3) {
      text += node.textContent;
      continue;
    }
    if (node.nodeName === "BR") {
      text += "\n";
      continue;
    }

    const element = node as HTMLElement;

    const ansiCode = +element.getAttribute("data-ansi")!;
    const newState: State = { ...states.at(-1)!, st: [...states.at(-1)!.st] };

    if (ansiCode < 30 && !newState.st.includes(ansiCode)) {
      newState.st = [...newState.st, ansiCode].sort((a, b) => a - b);
    }
    if (ansiCode >= 30 && ansiCode < 40) newState.fg = ansiCode;
    if (ansiCode >= 40) newState.bg = ansiCode;

    states.push(newState);
    text += sgr(newState, ansiCode >= 40 ? newState.bg : newState.fg);
    text += nodesToANSI(node.childNodes, states);
    states.pop();
    text += `\x1b[0m`;
    const parent = states.at(-1)!;
    if (parent.fg !== 2) text += sgr(parent, parent.fg);
    if (parent.bg !== 2) text += sgr(parent, parent.bg);
  }
  return text;
}

function editorToANSI(editor: HTMLElement) {
  return nodesToANSI(editor.childNodes, [{ fg: 2, bg: 2, st: [] }]);
}

/** The span the style buttons wrap text in, and nodesToANSI reads back. */
function ansiSpan(code: number): HTMLSpanElement {
  const span = document.createElement("span");
  span.classList.add(styles[`ansi${code}`]);
  span.setAttribute("data-ansi", code.toString());
  return span;
}

/** The reverse of nodesToANSI, nesting the spans the way the buttons do. */
function ansiToNodes(ansi: string): DocumentFragment {
  const fragment = document.createDocumentFragment();
  for (const { text, style } of parseANSI(ansi)) {
    let node: Node = document.createDocumentFragment();
    text.split("\n").forEach((line, i) => {
      if (i > 0) node.appendChild(document.createElement("br"));
      if (line) node.appendChild(document.createTextNode(line));
    });

    for (const code of [...(style.st ?? []), style.fg, style.bg]) {
      if (!code) continue;
      const span = ansiSpan(code);
      span.appendChild(node);
      node = span;
    }
    fragment.appendChild(node);
  }
  return fragment;
}

export default function ToolsColoredText() {
  const editorRef = useRef<HTMLDivElement>(null);

  const [copyButtonText, setCopyButtonText] = useState("Copy Format");

  const setSavedText = useColoredTextStore((state) => state.setText);
  const theme = useColoredTextStore((state) => state.theme);
  const setTheme = useColoredTextStore((state) => state.setTheme);

  // Only read on mount, the editor's DOM is the source of truth after that.
  useLayoutEffect(() => {
    editorRef.current?.replaceChildren(
      ansiToNodes(useColoredTextStore.getState().text),
    );
  }, []);

  function save() {
    const editor = editorRef.current;
    if (!editor) return;
    setSavedText(editorToANSI(editor));
  }

  // Every paste goes through here, plain text too: the browser's own paste
  // brings markup that nodesToANSI can't read back.
  function paste(e: ClipboardEvent<HTMLDivElement>) {
    const text = e.clipboardData.getData("text/plain");

    const selection = window.getSelection();
    if (!selection?.rangeCount) return;
    e.preventDefault();

    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(ansiToNodes(text));
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);

    save();
  }

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    // https://stackoverflow.com/a/61237402
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Enter") {
        document.execCommand("insertLineBreak");
        e.preventDefault();
      }
    }

    editor.addEventListener("keydown", onKeyDown);

    return () => {
      editor.removeEventListener("keydown", onKeyDown);
    };
  }, [editorRef.current]);

  function handleStyleChange(style: number) {
    const editor = editorRef.current;
    if (!editor) return;

    if (!style) {
      // Reassigning innerText strips all child markup, resetting the styling
      // biome-ignore lint/correctness/noSelfAssign: intentional DOM reset
      editor.innerText = editor.innerText;
      save();
      return;
    }

    const selection = window.getSelection();
    if (!selection) return;

    // Make sure selection is in editor
    if (!editor.contains(selection.anchorNode)) return;

    const text = selection.toString();

    const span = ansiSpan(style);
    span.innerText = text;

    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(span);

    range.selectNodeContents(span);
    selection.removeAllRanges();
    selection.addRange(range);

    save();
  }

  function copyText() {
    const editor = editorRef.current;
    if (!editor) return;

    const toCopy = ["```ansi", editorToANSI(editor), "```"].join("\n");

    navigator.clipboard.writeText(toCopy).then(
      () => {
        setCopyButtonText("Copied!");
        setTimeout(() => {
          setCopyButtonText("Copy Format");
        }, 1000);
      },
      (_err) => {
        setCopyButtonText("Failed to copy ...");
        setTimeout(() => {
          setCopyButtonText("Copy Format");
        }, 1000);
      },
    );
  }

  return (
    <div className={styles.root} data-theme={theme}>
      <div className="mb-4">
        <div className="text-mist-400 text-xs mb-1.5">Preview theme</div>
        <SegmentedControl options={themes} value={theme} onChange={setTheme} />
      </div>
      <div className="flex flex-col md:flex-row md:items-end mb-3">
        <div className="flex-auto mb-5 md:mb-0 space-y-3">
          <div>
            <div className="text-mist-400 text-xs mb-1.5">Text color</div>
            <div className="flex flex-wrap gap-2">
              {foregroundColors.map(({ code, name }) => (
                <button
                  key={code}
                  type="button"
                  aria-label={`Text color ${name}`}
                  title={name}
                  className={clsx(
                    styles.swatch,
                    styles.codeFont,
                    ansiClass(code),
                  )}
                  onClick={() => handleStyleChange(code)}
                >
                  Aa
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-mist-400 text-xs mb-1.5">Background color</div>
            <div className="flex flex-wrap gap-2">
              {backgroundColors.map(({ code, name }) => (
                <button
                  key={code}
                  type="button"
                  aria-label={`Background color ${name}`}
                  title={name}
                  className={clsx(
                    styles.swatch,
                    styles.codeFont,
                    ansiClass(code),
                  )}
                  onClick={() => handleStyleChange(code)}
                >
                  Aa
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 text-mist-100 mb-2">
          <button
            type="button"
            className="bg-ink-600 hover:bg-ink-500 px-2 py-1 rounded-lg"
            onClick={() => handleStyleChange(0)}
          >
            Reset All
          </button>
          <button
            type="button"
            className="bg-ink-600 hover:bg-ink-500 px-2 py-1 rounded-lg font-bold"
            onClick={() => handleStyleChange(1)}
          >
            Bold
          </button>
          <button
            type="button"
            className="bg-ink-600 hover:bg-ink-500 px-2 py-1 rounded-lg italic"
            onClick={() => handleStyleChange(3)}
          >
            Italic
          </button>
          <button
            type="button"
            className="bg-ink-600 hover:bg-ink-500 px-2 py-1 rounded-lg underline"
            onClick={() => handleStyleChange(4)}
          >
            Underline
          </button>
          <button
            type="button"
            className="bg-ink-600 hover:bg-ink-500 px-2 py-1 rounded-lg line-through"
            onClick={() => handleStyleChange(9)}
          >
            Strikethrough
          </button>
        </div>
      </div>
      <div className={clsx(styles.chat, "mb-5")}>
        <div
          className={clsx(styles.editor, styles.codeFont)}
          ref={editorRef}
          role="textbox"
          aria-label="Colored text"
          aria-multiline={true}
          contentEditable={true}
          suppressContentEditableWarning={true}
          onInput={save}
          onPaste={paste}
        ></div>
      </div>
      <div className="flex flex-col md:flex-row md:items-center md:space-x-3 space-y-3 md:space-y-0">
        <button
          className="px-3 py-2 rounded-lg border-2 border-white/15 text-mist-100 hover:bg-white/5 hover:border-white/30 transition-colors cursor-pointer flex-none"
          onClick={copyText}
        >
          {copyButtonText}
        </button>
        <div className="text-mist-400 text-sm font-light">
          To keep editing colored text you copied before, paste it into the
          editor.
        </div>
      </div>
    </div>
  );
}

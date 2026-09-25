import clsx from "clsx";
import styles from "./ToolsColoredText.module.css";
import {
  type ClipboardEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { type ANSISegment, parseANSI } from "../util/ansi";
import { useColoredTextStore } from "../state/coloredText";

const foregroundColors = [30, 31, 32, 33, 34, 35, 36, 37];
const backgroundColors = [40, 41, 42, 43, 44, 45, 46, 47];

function nodesToANSI(
  nodes: NodeListOf<ChildNode>,
  states: Record<string, number>[],
) {
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
    const newState = Object.assign({}, states.at(-1));

    if (ansiCode < 30) newState.st = ansiCode;
    if (ansiCode >= 30 && ansiCode < 40) newState.fg = ansiCode;
    if (ansiCode >= 40) newState.bg = ansiCode;

    states.push(newState);
    text += `\x1b[${newState.st};${
      ansiCode >= 40 ? newState.bg : newState.fg
    }m`;
    text += nodesToANSI(node.childNodes, states);
    states.pop();
    text += `\x1b[0m`;
    if (states.at(-1)!.fg !== 2)
      text += `\x1b[${states.at(-1)!.st};${states.at(-1)!.fg}m`;
    if (states.at(-1)!.bg !== 2)
      text += `\x1b[${states.at(-1)!.st};${states.at(-1)!.bg}m`;
  }
  return text;
}

function editorToANSI(editor: HTMLElement) {
  return nodesToANSI(editor.childNodes, [{ fg: 2, bg: 2, st: 2 }]);
}

/** The reverse of nodesToANSI, nesting the spans the way the buttons do. */
function segmentsToNodes(segments: ANSISegment[]): Node[] {
  return segments.map(({ text, style }) => {
    let node: Node = document.createDocumentFragment();
    text.split("\n").forEach((line, i) => {
      if (i > 0) node.appendChild(document.createElement("br"));
      if (line) node.appendChild(document.createTextNode(line));
    });

    for (const code of [style.st, style.fg, style.bg]) {
      if (!code) continue;
      const span = document.createElement("span");
      span.classList.add(styles[`ansi${code}`]);
      span.setAttribute("data-ansi", code.toString());
      span.appendChild(node);
      node = span;
    }
    return node;
  });
}

export default function ToolsColoredText() {
  const editorRef = useRef<HTMLDivElement>(null);

  const [copyButtonText, setCopyButtonText] = useState("Copy Format");

  // Only read on mount, the editor's DOM is the source of truth after that.
  const [savedText] = useState(() => useColoredTextStore.getState().text);
  const setSavedText = useColoredTextStore((state) => state.setText);

  useLayoutEffect(() => {
    if (savedText === null) return;
    editorRef.current?.replaceChildren(
      ...segmentsToNodes(parseANSI(savedText)),
    );
  }, []);

  function save() {
    const editor = editorRef.current;
    if (!editor) return;
    setSavedText(editorToANSI(editor));
  }

  function pasteANSI(e: ClipboardEvent<HTMLDivElement>) {
    const text = e.clipboardData.getData("text/plain");
    if (!text.includes("\x1b[")) return;

    const selection = window.getSelection();
    if (!selection?.rangeCount) return;
    e.preventDefault();

    const fragment = document.createDocumentFragment();
    fragment.append(...segmentsToNodes(parseANSI(text)));

    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(fragment);
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

    const span = document.createElement("span");
    span.innerText = text;
    span.classList.add(styles[`ansi${style}`]);
    span.setAttribute("data-ansi", style.toString());

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
    <div>
      <div className="flex flex-col md:flex-row md:items-end mb-3">
        <div className="flex-auto mb-5 md:mb-0">
          <div className="flex items-center space-x-3">
            <div className="flex flex-wrap">
              {foregroundColors.map((style) => (
                <button
                  key={style}
                  className={clsx(
                    "h-8 w-10 rounded-xl cursor-pointer bg-ink-900 mr-2 mb-2",
                    styles[`ansi${style}`],
                  )}
                  onClick={() => handleStyleChange(style)}
                >
                  T
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex flex-wrap">
              {backgroundColors.map((style) => (
                <button
                  key={style}
                  className={clsx(
                    "h-8 w-10 rounded-xl cursor-pointer text-white mr-2 mb-2",
                    styles[`ansi${style}`],
                  )}
                  onClick={() => handleStyleChange(style)}
                ></button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex space-x-3 text-mist-100 mb-2">
          <button
            className="bg-ink-600 hover:bg-ink-500 px-2 py-1 rounded-lg"
            onClick={() => handleStyleChange(0)}
          >
            Reset All
          </button>
          <button
            className="bg-ink-600 hover:bg-ink-500 px-2 py-1 rounded-lg"
            onClick={() => handleStyleChange(1)}
          >
            Bold
          </button>
          <button
            className="bg-ink-600 hover:bg-ink-500 px-2 py-1 rounded-lg"
            onClick={() => handleStyleChange(4)}
          >
            Underline
          </button>
        </div>
      </div>
      <div
        className={clsx(
          "rounded-xl bg-ink-900 px-3 py-2 focus:outline-none text-mist-100 min-h-64 mb-5",
          styles.editor,
        )}
        ref={editorRef}
        role="textbox"
        aria-label="Colored text"
        aria-multiline={true}
        contentEditable={true}
        suppressContentEditableWarning={true}
        onInput={save}
        onPaste={pasteANSI}
      >
        {savedText === null && (
          <>
            <span className={styles.ansi45} data-ansi="45">
              Just select
            </span>{" "}
            <span className={styles.ansi34} data-ansi="34">
              some text
            </span>{" "}
            and{" "}
            <span className={styles.ansi32} data-ansi="32">
              click
            </span>{" "}
            on the{" "}
            <span className={styles.ansi31} data-ansi="31">
              <span className={styles.ansi1} data-ansi="1">
                color
              </span>
            </span>{" "}
            or{" "}
            <span className={styles.ansi4} data-ansi="4">
              format that you like
            </span>
            !
          </>
        )}
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

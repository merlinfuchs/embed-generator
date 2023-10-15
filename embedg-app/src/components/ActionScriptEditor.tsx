import { useMemo, useState } from "react";
import TextareaAutosize from "react-textarea-autosize";
import highlight from "highlight.js/lib/core";
import python from "highlight.js/lib/languages/python";
import "../discord/highlight.css";

highlight.registerLanguage("python", python);

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export default function ActionScriptEditor({ value, onChange }: Props) {
  const [height, setHeight] = useState(0);

  const code = useMemo(() => {
    try {
      return highlight.highlight(value, { language: "python" }).value;
    } catch (e) {
      return value;
    }
  }, [value]);

  return (
    <div>
      <div className="mb-1.5 flex">
        <div className="uppercase text-gray-300 text-sm font-medium">
          Python Code
        </div>
        <div className="text-sm italic font-light text-gray-400 ml-2">
          {value.length} / 4000
        </div>
      </div>
      <div className="relative" style={{ height: `${height}px` }}>
        <TextareaAutosize
          className="px-3 py-3 rounded w-full absolute inset-0 z-10 bg-transparent text-transparent focus:outline-none caret-white font-mono text-sm font-light"
          minRows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onHeightChange={(height) => setHeight(height)}
          onKeyDown={(e) => {
            if (e.key === "Tab") {
              e.preventDefault();
              const start = e.currentTarget.selectionStart;
              const end = e.currentTarget.selectionEnd;
              e.currentTarget.value =
                value.substring(0, start) + "\t" + value.substring(end);
              onChange(e.currentTarget.value);
              e.currentTarget.selectionStart = start + 1;
              e.currentTarget.selectionEnd = start + 1;
            }
          }}
          maxLength={4000}
        ></TextareaAutosize>

        <pre
          aria-hidden="true"
          className="px-3 py-3 rounded bg-dark-2 w-full absolute inset-0 text-white font-mono text-sm font-light overflow-y-auto"
          style={{ height: `${height}px` }}
        >
          <code dangerouslySetInnerHTML={{ __html: code }}></code>
        </pre>
      </div>
    </div>
  );
}

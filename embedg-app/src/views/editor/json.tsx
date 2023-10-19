import ReactCodeMirror from "@uiw/react-codemirror";
import { useEffect, useState } from "react";
import EditorModal from "../../components/EditorModal";
import { useCurrentMessageStore } from "../../state/message";
import { json, jsonParseLinter } from "@codemirror/lang-json";
import { githubDark } from "@uiw/codemirror-theme-github";
import { linter, lintGutter } from "@codemirror/lint";
import { parseMessageWithAction } from "../../discord/restoreSchema";
import { useNavigate } from "react-router-dom";
import { ClipboardDocumentIcon } from "@heroicons/react/24/outline";
import { useToasts } from "../../util/toasts";

export default function JsonView() {
  const navigate = useNavigate();
  const createToast = useToasts((state) => state.create);

  const msg = useCurrentMessageStore();

  const [raw, setRaw] = useState("{}");

  useEffect(() => {
    setRaw(JSON.stringify(msg, null, 2));
  }, [msg]);

  function save() {
    try {
      const data = JSON.parse(raw);
      const parsedData = parseMessageWithAction(data);

      msg.replace(parsedData);
      navigate("/editor");
    } catch (e) {
      console.error(e);
    }
  }

  function copy() {
    navigator.clipboard
      .writeText(raw)
      .then(() =>
        createToast({
          title: "Copied JSON",
          message: "The JSON code has been copied to your clipboard",
          type: "success",
        })
      )
      .catch(() =>
        createToast({
          title: "Failed to copy JSON",
          message: "Failed to copy the JSON code to your clipboard",
          type: "error",
        })
      );
  }

  return (
    <EditorModal height="full">
      <div className="h-full flex flex-col p-1.5 md:p-3">
        <ReactCodeMirror
          className="flex-1 rounded overflow-hidden"
          height="100%"
          width="100%"
          value={raw}
          basicSetup={{
            lineNumbers: false,
            foldGutter: false,
            indentOnInput: true,
          }}
          extensions={[lintGutter(), json(), linter(jsonParseLinter())]}
          theme={githubDark}
          onChange={(v) => setRaw(v)}
        />
        <div className="mt-3 flex justify-between space-x-3">
          <button
            className="border-2 border-dark-7 hover:bg-dark-5 px-3 py-2 rounded text-white flex items-center"
            onClick={copy}
          >
            <ClipboardDocumentIcon className="h-5 w-5" />
            <div className="hidden ml-2 sm:block">Copy</div>
          </button>
          <div className="flex space-x-3">
            <button
              className="border-2 border-dark-7 hover:bg-dark-5 px-3 py-2 rounded text-white"
              onClick={() => navigate("/editor")}
            >
              Cancel
            </button>
            <button
              className="bg-blurple hover:bg-blurple-dark px-3 py-2 rounded text-white"
              onClick={save}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </EditorModal>
  );
}

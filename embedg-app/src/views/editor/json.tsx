import ReactCodeMirror from "@uiw/react-codemirror";
import { useEffect, useState } from "react";
import EditorModal from "../../components/EditorModal";
import { useCurrentMessageStore } from "../../state/message";
import { json, jsonParseLinter } from "@codemirror/lang-json";
import { githubDark } from "@uiw/codemirror-theme-github";
import { linter, lintGutter } from "@codemirror/lint";
import { messageSchema } from "../../discord/schema";
import { useNavigate } from "react-router-dom";

export default function JsonView() {
  const navigate = useNavigate();

  const msg = useCurrentMessageStore();

  const [raw, setRaw] = useState("{}");

  useEffect(() => {
    setRaw(JSON.stringify(msg, null, 2));
  }, [msg]);

  function save() {
    try {
      const data = JSON.parse(raw);
      const parsedData = messageSchema.parse(data);
      msg.replace(parsedData);
      navigate("/");
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <EditorModal>
      <div className="h-full flex flex-col p-3">
        <ReactCodeMirror
          className="flex-1 rounded"
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
        <div className="mt-3 flex justify-end space-x-2">
          <button
            className="border-2 border-dark-7 hover:bg-dark-5 px-3 py-2 rounded text-white"
            onClick={() => navigate("/")}
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
    </EditorModal>
  );
}

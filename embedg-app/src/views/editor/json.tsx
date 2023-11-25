import ReactCodeMirror from "@uiw/react-codemirror";
import { useEffect, useState } from "react";
import Modal from "../../components/Modal";
import { useCurrentMessageStore } from "../../state/message";
import { json, jsonParseLinter } from "@codemirror/lang-json";
import { githubDark } from "@uiw/codemirror-theme-github";
import { linter, lintGutter } from "@codemirror/lint";
import { parseMessageWithAction } from "../../discord/restoreSchema";
import { useNavigate } from "react-router-dom";
import { useToasts } from "../../util/toasts";

export default function JsonView() {
  const navigate = useNavigate();
  const createToast = useToasts((s) => s.create);

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
      createToast({
        type: "error",
        title: "Failed to parse message",
        message:
          "The message you entered is not a valid Discord webhook message. Please check for mistakes in your message and try again.",
      });
    }
  }

  return (
    <Modal height="full" onClose={() => navigate("/editor")}>
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
        <div className="mt-3 flex justify-end space-x-2">
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
    </Modal>
  );
}

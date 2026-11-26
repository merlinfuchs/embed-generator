import ReactCodeMirror from "@uiw/react-codemirror";
import { json, jsonParseLinter } from "@codemirror/lang-json";
import { githubDark } from "@uiw/codemirror-theme-github";
import { linter, lintGutter } from "@codemirror/lint";
import { useState } from "react";
import Modal from "./Modal";
import { useToasts } from "../util/toasts";
import { op } from "../util/analytics";
import {
  type EmbedLinkFields,
  embedLinkToJson,
  parseEmbedLinkJson,
} from "../util/embedLinkJson";

interface Props {
  fields: EmbedLinkFields;
  /** Gets the parsed fields once the JSON has been checked. */
  onSave: (fields: EmbedLinkFields) => void;
  onClose: () => void;
}

/** The JSON code of an embed link, like the one of the message editor. */
export default function ToolsEmbedLinksJson({
  fields,
  onSave,
  onClose,
}: Props) {
  const createToast = useToasts((s) => s.create);

  const [raw, setRaw] = useState(() => embedLinkToJson(fields));
  // Saving without an edit is just closing the view, not an import.
  const [edited, setEdited] = useState(false);

  function save() {
    if (!edited) {
      onClose();
      return;
    }

    try {
      onSave(parseEmbedLinkJson(raw));
      op.track("embed_link_json_imported");
      onClose();
    } catch (e) {
      console.error(e);
      createToast({
        type: "error",
        title: "Failed to parse embed link",
        message:
          "The JSON you entered is not a valid embed link. Please check for mistakes and try again.",
      });
    }
  }

  return (
    <Modal height="full" onClose={onClose}>
      <div className="h-full flex flex-col p-1.5 md:p-3">
        <ReactCodeMirror
          className="flex-1 rounded-lg overflow-hidden"
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
          onChange={(v) => {
            setRaw(v);
            setEdited(true);
          }}
        />
        <div className="mt-3 flex justify-end space-x-2">
          <button
            className="border-2 border-white/15 hover:bg-white/5 hover:border-white/30 transition-colors px-3 py-2 rounded-lg text-white"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="bg-azure-500 hover:bg-azure-400 px-3 py-2 rounded-lg text-white"
            onClick={save}
          >
            Save
          </button>
        </div>
      </div>
    </Modal>
  );
}

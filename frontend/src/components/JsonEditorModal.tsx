import { useEffect, useMemo, useState } from "react";
import { ZodError } from "zod";
import { jsonToMessageStrict, messageToJson } from "../discord/utils";
import useMessage from "../hooks/useMessage";
import BaseModal from "./BaseModal";

interface Props {
  visible: boolean;
  setVisible: (visible: boolean) => void;
}

export default function JsonEditorModal({ visible, setVisible }: Props) {
  const [msg, dispatch] = useMessage();

  const currentJson = useMemo(
    () => JSON.stringify(messageToJson(msg), undefined, 4),
    [msg]
  );

  const [json, setJson] = useState(currentJson);

  useEffect(() => setJson(currentJson), [currentJson]);

  const [error, setError] = useState<ZodError | null>(null);

  function close() {
    setVisible(false);
    setJson(currentJson);
  }

  function save() {
    try {
      const result = jsonToMessageStrict(JSON.parse(json));
      if (result.success) {
        dispatch({ type: "replace", value: result.message });
        setVisible(false);
        setError(null);
        setJson(currentJson);
      } else {
        setError(result.error);
      }
    } catch {
      alert("Invalid JSON provided");
    }
  }

  return (
    <BaseModal visible={visible} setVisible={setVisible} size="large">
      <div className="space-y-3">
        <textarea
          value={json}
          onChange={(e) => setJson(e.target.value)}
          className="w-full h-96 bg-dark-2 rounded no-ring rounded"
        ></textarea>
        {error && (
          <div className="h-32 overflow-y-auto bg-dark-2 rounded py-1 px-2">
            {error.errors.map((e) => (
              <div className="flex space-x-3">
                <div className="text-gray-300">{e.path.join(".")}</div>
                <div className="text-red">{e.message}</div>
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-end space-x-2">
          <button
            className="border-2 border-dark-7 px-3 py-2 rounded transition-colors hover:bg-dark-6"
            onClick={close}
          >
            Cancel
          </button>
          <button
            className="bg-blurple px-3 py-2 rounded transition-colors hover:bg-blurple-dark"
            onClick={save}
          >
            Save
          </button>
        </div>
      </div>
    </BaseModal>
  );
}

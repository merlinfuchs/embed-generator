import { useEffect, useMemo, useState } from "react";
import { jsonToMessage, messageToJson } from "../discord/utils";
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
  const [errors, setErrors] = useState<string[] | null>(null);

  useEffect(() => setJson(json), [json]);

  function close() {
    setVisible(false);
    setErrors(null);
  }

  function save() {
    const result = jsonToMessage(JSON.parse(json));
    if (result.success) {
      dispatch({ type: "replace", value: result.message });
      setVisible(false);
      setErrors(null);
    } else {
      setErrors(result.errors);
    }
  }

  return (
    <BaseModal visible={visible} setVisible={setVisible} size="large">
      <div className="space-y-3">
        <textarea
          value={json}
          onChange={(e) => setJson(e.target.value)}
          className="w-full h-96 bg-dark-3 rounded no-ring rounded"
        ></textarea>
        <div>
          {errors?.map((e, i) => (
            <div key={i} className="text-red text-sm">
              - {e}
            </div>
          ))}
        </div>
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

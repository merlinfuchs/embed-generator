import { useMemo } from "react";
import { messageToJson } from "../discord/utils";
import useMessage from "../hooks/useMessage";

export default function JsonEditor() {
  const [msg] = useMessage();

  const json = useMemo(
    () => JSON.stringify(messageToJson(msg), undefined, 4),
    [msg]
  );

  return (
    <textarea
      value={json}
      className="w-full h-96 bg-dark-4 rounded m-1"
    ></textarea>
  );
}

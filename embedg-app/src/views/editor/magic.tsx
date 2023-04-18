import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGenerateMagicMessageMutation } from "../../api/mutations";
import EditorModal from "../../components/EditorModal";
import MessagePreview from "../../components/MessagePreview";
import { messageSchema } from "../../discord/schema";
import { useCurrentMessageStore } from "../../state/message";

export default function MagicView() {
  const navigate = useNavigate();
  const replaceMessage = useCurrentMessageStore((state) => state.replace);

  const [history, setHistory] = useState<string[]>([]);
  const [baseData, setBaseData] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");

  const [output, setOutput] = useState("");

  const { data, mutate, isLoading } = useGenerateMagicMessageMutation();

  useEffect(() => {
    if (data) {
      setBaseData(data.data);
      setOutput(data.data);
    }
  }, [data]);

  useEffect(() => {
    const data = JSON.stringify(useCurrentMessageStore.getState());
    setBaseData(data);
    setOutput(data);
  }, []);

  function generate() {
    if (isLoading) {
      return;
    }

    mutate({
      base_data: baseData,
      prompt: prompt,
    });

    setHistory((h) => [...h, prompt]);
    setPrompt("");
  }

  function clear() {
    setBaseData(null);
    setOutput("");
    setHistory([]);
  }

  const outputData = useMemo(() => {
    if (!output) {
      return null;
    }
    try {
      const data = JSON.parse(output);
      return messageSchema.parse(data);
    } catch (e) {
      console.error(e);
      return null;
    }
  }, [output]);

  function save() {
    if (outputData) {
      replaceMessage(outputData);
      navigate("/");
    }
  }

  return (
    <EditorModal height="full">
      <div className="flex h-full">
        <div className="w-1/2 p-5 overflow-y-auto">
          <div>
            {history.map((h, i) => (
              <div
                key={i}
                className="text-gray-300 px-3 py-2 rounded bg-dark-2 mb-2"
              >
                {h}
              </div>
            ))}
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="bg-dark-2 px-3 py-2 rounded w-full text-white focus:outline-none h-64 mt-0 mb-3"
            placeholder="Enter a prompt..."
          />
          <div className="flex space-x-3">
            <button
              className={clsx(
                "text-white px-3 py-2 rounded",
                isLoading ? "bg-dark-5 cursor-default" : "bg-blurple"
              )}
              onClick={generate}
            >
              Submit
            </button>
            <button
              className="text-white px-3 py-2 rounded border-2 border-red hover:bg-red"
              onClick={clear}
            >
              Clear History
            </button>
            <button
              className="text-white px-3 py-2 rounded border-2 border-green hover:bg-green"
              onClick={save}
            >
              Save
            </button>
          </div>
        </div>
        <div className="w-1/2 rounded-r-xl bg-dark-4 overflow-y-auto">
          <div className="rounded text-white h-full px-5 py-3">
            {outputData && <MessagePreview msg={outputData} />}
          </div>
        </div>
      </div>
    </EditorModal>
  );
}

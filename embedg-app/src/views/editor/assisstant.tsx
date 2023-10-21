import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAssistantGenerateMessageMutation } from "../../api/mutations";
import Modal from "../../components/Modal";
import MessagePreview from "../../components/MessagePreview";
import { parseMessageWithAction } from "../../discord/restoreSchema";
import { useCurrentMessageStore } from "../../state/message";
import { useSendSettingsStore } from "../../state/sendSettings";
import { SparklesIcon } from "@heroicons/react/24/solid";
import { useToasts } from "../../util/toasts";
import { Message } from "../../discord/schema";

export default function AssistantView() {
  const navigate = useNavigate();
  const createToast = useToasts((s) => s.create);

  const guildId = useSendSettingsStore((s) => s.guildId);

  const [history, setHistory] = useState<string[]>([]);
  const [baseData, setBaseData] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");

  const [output, setOutput] = useState<Message | null>(null);

  const { data, mutate, isLoading } = useAssistantGenerateMessageMutation();

  useEffect(() => {
    if (data?.success) {
      try {
        const parsed = parseMessageWithAction(JSON.parse(data.data.data));
        setOutput(parsed);
        setBaseData(data.data.data);
      } catch (e) {
        console.log(e);
        createToast({
          title: "Something went wrong",
          message:
            "Your prompt has produced an invalid message, please try again with a different prompt.",
          type: "error",
        });
      }
    }
  }, [data]);

  useEffect(() => {
    setBaseData(JSON.stringify(useCurrentMessageStore.getState()));
    setOutput(useCurrentMessageStore.getState());
  }, []);

  function generate() {
    if (isLoading) {
      return;
    }

    if (!guildId) {
      return;
    }

    mutate({
      guildId: guildId,
      req: {
        base_data: baseData,
        prompt: prompt,
      },
    });

    setHistory((h) => [...h, prompt]);
    setPrompt("");
  }

  function clear() {
    setBaseData(null);
    setOutput(null);
    setHistory([]);
  }

  function reset() {
    setBaseData(JSON.stringify(useCurrentMessageStore.getState()));
    setOutput(useCurrentMessageStore.getState());
  }

  function save() {
    if (output) {
      useCurrentMessageStore.setState(output);
      navigate("/editor");
    }
  }

  return (
    <Modal height="full" onClose={() => navigate("/editor")}>
      <div className="flex h-full">
        <div className="w-1/2 p-5 overflow-y-hidden flex flex-col">
          <div className="text-2xl font-medium text-gray-200 mb-5 flex items-center space-x-3">
            <SparklesIcon className="h-7 w-7 text-yellow" />
            <div>AI Assistant</div>
          </div>
          <div className="flex-auto space-y-3 overflow-y-auto mb-5">
            {history.map((h, i) => (
              <div
                key={i}
                className="text-gray-300 px-3 py-2 rounded-md bg-dark-2 whitespace-pre-line"
              >
                {h}
              </div>
            ))}
          </div>
          <div className="flex-none">
            <div className="flex justify-end space-x-3 mb-3">
              <button
                className="text-white px-3 py-2 rounded border-2 border-red hover:bg-red"
                onClick={reset}
              >
                Restart
              </button>
              <button
                className="text-white px-3 py-2 rounded border-2 border-red hover:bg-red"
                onClick={clear}
              >
                Clear All
              </button>
              <button
                className="text-white px-3 py-2 rounded border-2 border-green hover:bg-green"
                onClick={save}
              >
                Save to Editor
              </button>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="bg-dark-2 px-3 py-2 rounded w-full text-white focus:outline-none h-32 mt-0 mb-3"
              placeholder="Enter a prompt..."
            />
            <div className="flex justify-end space-x-3">
              <button
                className={clsx(
                  "text-white px-3 py-2 rounded flex items-center space-x-3",
                  isLoading ? "bg-dark-5 cursor-not-allowed " : "bg-blurple"
                )}
                onClick={generate}
              >
                {isLoading && (
                  <div className="relative">
                    <div className="h-4 w-4 rounded-full bg-blurple"></div>
                    <div className="h-4 w-4 rounded-full bg-blurple animate-ping absolute inset-0"></div>
                  </div>
                )}
                <div>Submit</div>
              </button>
            </div>
          </div>
        </div>
        <div className="w-1/2 rounded-r-xl bg-dark-4 overflow-y-auto">
          <div
            className={clsx(
              "rounded text-white h-full px-5 py-3",
              isLoading && "animate-pulse"
            )}
          >
            {output && <MessagePreview msg={output} />}
          </div>
        </div>
      </div>
    </Modal>
  );
}

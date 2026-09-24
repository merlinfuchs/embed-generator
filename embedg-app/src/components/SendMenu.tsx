import { useShallow } from "zustand/react/shallow";
import clsx from "clsx";
import { useUserQuery } from "../api/queries";
import { useSendSettingsStore } from "../state/sendSettings";
import LoginSuggest from "./LoginSuggest";
import SendMenuChannel from "./SendMenuChannel";
import SendMenuWebhook from "./SendMenuWebhook";

export default function SendMenu() {
  const [mode, setMode] = useSendSettingsStore(
    useShallow((state) => [state.mode, state.setMode]),
  );

  const { data: user } = useUserQuery();

  function toggleMode() {
    setMode(mode === "webhook" ? "channel" : "webhook");
  }

  return (
    <div>
      <div className="flex mb-5">
        <button
          className="flex bg-ink-900 p-1 rounded-lg border border-white/10 text-sm font-medium text-mist-400"
          onClick={toggleMode}
        >
          <div
            className={clsx(
              "py-1 px-3 rounded-md transition-colors",
              mode === "webhook" && "bg-ink-700 text-mist-100",
            )}
          >
            Webhook
          </div>
          <div
            className={clsx(
              "py-1 px-3 rounded-md transition-colors",
              mode === "channel" && "bg-ink-700 text-mist-100",
            )}
          >
            Channel
          </div>
        </button>
      </div>
      {mode === "webhook" ? (
        <SendMenuWebhook />
      ) : user ? (
        <SendMenuChannel />
      ) : (
        <LoginSuggest />
      )}
    </div>
  );
}

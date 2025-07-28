import clsx from "clsx";
import { shallow } from "zustand/shallow";
import { useUserQuery } from "../api/queries";
import { useSendSettingsStore } from "../state/sendSettings";
import LoginSuggest from "./LoginSuggest";
import SendMenuChannel from "./SendMenuChannel";
import SendMenuWebhook from "./SendMenuWebhook";

export default function SendMenu() {
  const [mode, setMode] = useSendSettingsStore(
    (state) => [state.mode, state.setMode],
    shallow
  );

  const { data: user } = useUserQuery();

  function toggleMode() {
    setMode(mode === "webhook" ? "channel" : "webhook");
  }

  return (
    <div>
      <div className="flex mb-5">
        <button
          className="flex bg-dark-2 p-1 rounded text-white"
          onClick={toggleMode}
        >
          <div
            className={clsx(
              "py-1 px-2 rounded transition-colors",
              mode === "webhook" && "bg-dark-3"
            )}
          >
            Webhook
          </div>
          <div
            className={clsx(
              "py-1 px-2 rounded transition-colors",
              mode === "channel" && "bg-dark-3"
            )}
          >
            Channel
          </div>
        </button>
      </div>
      {mode === "webhook" ? (
        <SendMenuWebhook />
      ) : !!user ? (
        <SendMenuChannel />
      ) : (
        <LoginSuggest />
      )}
    </div>
  );
}

import { useShallow } from "zustand/react/shallow";
import clsx from "clsx";
import { useUserQuery } from "../api/queries";
import { useSendSettingsStore } from "../state/sendSettings";
import LoginSuggest from "./LoginSuggest";
import SendMenuChannel from "./SendMenuChannel";
import SendMenuWebhook from "./SendMenuWebhook";

const MODES = [
  {
    value: "webhook",
    label: "Webhook",
    description:
      "Paste a webhook URL and send, no login needed. To use buttons with actions or select menus, switch to the Channel tab.",
  },
  {
    value: "channel",
    label: "Channel",
    description:
      "Log in, pick a server and channel, and the bot sends it for you. Every feature works here.",
  },
] as const;

export default function SendMenu() {
  const [mode, setMode] = useSendSettingsStore(
    useShallow((state) => [state.mode, state.setMode]),
  );

  const { data: user } = useUserQuery();

  return (
    <div>
      <div className="mb-5 space-y-2">
        <div className="flex">
          <div className="flex bg-ink-900 p-1 rounded-lg border border-white/10 text-sm font-medium text-mist-400">
            {MODES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                aria-pressed={mode === value}
                className={clsx(
                  "py-1 px-3 rounded-md transition-colors",
                  mode === value
                    ? "bg-ink-700 text-mist-100"
                    : "hover:text-mist-100",
                )}
                onClick={() => setMode(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="text-sm text-mist-400 font-light">
          {MODES.find((m) => m.value === mode)?.description}
        </div>
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

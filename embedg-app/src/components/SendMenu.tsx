import { QuestionMarkCircleIcon } from "@heroicons/react/24/outline";
import { useShallow } from "zustand/react/shallow";
import clsx from "clsx";
import { useUserQuery } from "../api/queries";
import { useSendSettingsStore } from "../state/sendSettings";
import LoginSuggest from "./LoginSuggest";
import SendMenuChannel from "./SendMenuChannel";
import SendMenuWebhook from "./SendMenuWebhook";
import Tooltip from "./Tooltip";

const MODES = [
  ["webhook", "Webhook"],
  ["channel", "Channel"],
] as const;

const MODES_HELP =
  "Webhook: paste a webhook URL and send, no login needed.\n\nChannel: log in, pick a server and channel, and the bot sends it. Needed for buttons with actions and select menus.\n\nClick for the full comparison.";

const MODES_DOCS_URL = "https://message.style/docs/guides/webhook-or-channel";

export default function SendMenu() {
  const [mode, setMode] = useSendSettingsStore(
    useShallow((state) => [state.mode, state.setMode]),
  );

  const { data: user } = useUserQuery();

  return (
    <div>
      <div className="flex items-center gap-2 mb-5">
        <div className="flex bg-ink-900 p-1 rounded-lg border border-white/10 text-sm font-medium text-mist-400">
          {MODES.map(([value, label]) => (
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
        <Tooltip text={MODES_HELP} wide>
          <a
            href={MODES_DOCS_URL}
            aria-label="Learn about webhook and channel mode"
            className="block text-mist-400 hover:text-mist-100"
            target="_blank"
            rel="noopener"
          >
            <QuestionMarkCircleIcon className="h-5 w-5" />
          </a>
        </Tooltip>
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

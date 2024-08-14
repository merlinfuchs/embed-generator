import { useCustomBotQuery } from "../api/queries";
import { useSendSettingsStore } from "../state/sendSettings";
import {
  CheckCircleIcon,
  SparklesIcon,
  XCircleIcon,
} from "@heroicons/react/24/solid";
import { userAvatarUrl } from "../discord/cdn";
import { useEffect, useState } from "react";
import { usePremiumGuildFeatures } from "../util/premium";
import {
  useCustomBotConfigureMutation,
  useCustomBotDisableMutation,
  useCustomBotUpdatePresenceMutation,
} from "../api/mutations";
import { useToasts } from "../util/toasts";
import PremiumSuggest from "./PremiumSuggest";
import clsx from "clsx";

export default function SettingsCustomBot() {
  const guildId = useSendSettingsStore((s) => s.guildId);
  const createToast = useToasts((s) => s.create);

  const { data: customBot, refetch } = useCustomBotQuery(guildId);
  const customBotAllowed = usePremiumGuildFeatures()?.custom_bot;

  const [confiure, setConfigure] = useState(false);

  const [token, setToken] = useState("");

  const [status, setStatus] = useState<"online" | "dnd" | "invisible">(
    "online"
  );
  const [customStatus, setCustomStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!customBot?.success) return;

    setStatus(customBot.data.gateway_status as any);
    setCustomStatus(customBot.data.gateway_activity_state);
  }, [customBot]);

  const configureMutation = useCustomBotConfigureMutation();
  const disableMutation = useCustomBotDisableMutation();

  function save() {
    if (!token || !guildId) return;

    configureMutation.mutate(
      {
        guildId,
        req: { token },
      },
      {
        onSuccess: (res) => {
          setToken("");
          if (res.success) {
            setConfigure(false);
            refetch();
          } else {
            createToast({
              title: "Something went wrong",
              message: res.error.message || "Unknown Error",
              type: "error",
            });
          }
        },
      }
    );
  }

  function disable() {
    if (!guildId) return;

    disableMutation.mutate(
      { guildId },
      {
        onSuccess: (res) => {
          if (res.success) {
            refetch();
          } else {
            createToast({
              title: "Something went wrong",
              message: res.error.message || "Unknown Error",
              type: "error",
            });
          }
        },
      }
    );
  }

  const updatePresenceMutation = useCustomBotUpdatePresenceMutation();

  function updateStatus() {
    if (!guildId) return;

    updatePresenceMutation.mutate(
      {
        guildId,
        req: {
          gateway_status: status,
          gateway_activity_type: !!customStatus ? 4 : undefined,
          gateway_activity_name: customStatus || undefined,
          gateway_activity_state: customStatus || undefined,
        },
      },
      {
        onSuccess: (res) => {
          if (!res.success) {
            createToast({
              title: "Something went wrong",
              message: res.error.message || "Unknown Error",
              type: "error",
            });
          } else {
            setStatus(res.data.gateway_status as any);
            setCustomStatus(res.data.gateway_activity_state || null);
            createToast({
              title: "Updated Status",
              message:
                "It may take up to 30 seconds until the update takes affect",
              type: "success",
            });
          }
        },
      }
    );
  }

  return (
    <div className="bg-dark-3 rounded-lg p-5">
      <div className="text-white text-2xl font-medium mb-10 flex items-center space-x-3">
        <SparklesIcon className="h-7 w-7 text-yellow" />
        <div>Custom Bot</div>
      </div>
      {!customBot?.success || confiure ? (
        customBotAllowed ? (
          <div>
            <div className="text-lg font-medium text-gray-300 mb-1">
              Bot Token
            </div>
            <div className="text-gray-400 font-light text-sm mb-5">
              You get the token by creating a bot in the Discord Developer
              Portal.
            </div>
            <input
              type="password"
              className="px-3 py-2 bg-dark-2 w-full rounded mb-10 focus:outline-none text-gray-300"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
            <div className="flex justify-end space-x-3">
              <button
                className="px-3 py-2 rounded bg-blurple hover:bg-blurple cursor-pointer text-white"
                onClick={save}
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <PremiumSuggest />
        )
      ) : (
        <div>
          <div className="mb-10">
            <div className="flex justify-between mb-10">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <img
                    src={userAvatarUrl({
                      id: customBot.data.user_id,
                      avatar: customBot.data.user_avatar,
                      discriminator: customBot.data.user_discriminator,
                    })}
                    alt=""
                    className="h-14 w-14 rounded-full shadow"
                  />
                  <div
                    className="h-5 w-5 bg-dark-3 rounded-full absolute right-0 bottom-0 flex items-center justify-center"
                    title="Change Status"
                  >
                    <div
                      className={clsx(
                        "h-3 w-3 rounded-full",
                        status === "online"
                          ? "bg-green"
                          : status === "dnd"
                          ? "bg-red"
                          : "bg-gray-500"
                      )}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="text-xl text-gray-300">
                    {customBot.data.user_name}
                  </div>
                  <div className="text-gray-500 text-sm">
                    {customBot.data.user_id}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col text-gray-300 space-y-5 mb-10">
            <div className="flex items-center space-x-2">
              {customBot.data.token_valid ? (
                <>
                  <CheckCircleIcon className="h-6 w-6 text-green" />
                  <div>The bot token is valid</div>
                </>
              ) : (
                <>
                  <XCircleIcon className="h-6 w-6 text-red" />
                  <div>The bot token is invalid</div>
                </>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {customBot.data.is_member ? (
                <>
                  <CheckCircleIcon className="h-6 w-6 text-green" />
                  <div>The bot has been added to your server</div>
                </>
              ) : (
                <>
                  <XCircleIcon className="h-6 w-6 text-red" />
                  <div>The bot hasn't been added to your server</div>
                </>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {customBot.data.has_permissions ? (
                <>
                  <CheckCircleIcon className="h-6 w-6 text-green" />
                  <div>The bot has Manage Webhooks permissions</div>
                </>
              ) : (
                <>
                  <XCircleIcon className="h-6 w-6 text-red" />
                  <div>The bot doesn't have Manage Webhooks permissions</div>
                </>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {customBot.data.handled_first_interaction ? (
                <>
                  <CheckCircleIcon className="h-6 w-6 text-green" />
                  <div>
                    The bot has handled its first interaction and is ready to go
                  </div>
                </>
              ) : (
                <>
                  <XCircleIcon className="h-6 w-6 text-red" />
                  <div>
                    The bot has handled its first interaction and is ready to go
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="mb-10">
            <div className="text-lg font-medium text-gray-300 mb-1">
              Invite the Bot
            </div>
            <div className="text-gray-400 font-light text-sm mb-5">
              Click below to invite the bot to your server. Make sure to give it
              Manage Webhook permissions.
            </div>
            <a
              href={customBot.data.invite_url}
              target="_blank"
              className="bg-blurple hover:bg-blurple-dark px-3 py-2 rounded text-white"
            >
              Invite Bot
            </a>
          </div>
          <div className="mb-10">
            <div className="text-lg font-medium text-gray-300 mb-1">
              Custom Status
            </div>
            <div className="text-gray-400 font-light text-sm mb-5">
              You can set the online status and a custom status message for your
              bot to give it your personal touch.
            </div>
            <div className="flex space-x-3">
              <select
                className="px-3 py-2 rounded bg-dark-2 text-gray-300"
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
              >
                <option value="online">Online</option>
                <option value="dnd">Do Not Disturb</option>
                <option value="invisible">Invisible</option>
              </select>
              <input
                className="px-3 py-2 bg-dark-2 rounded focus:outline-none text-gray-300"
                placeholder="Custom Status"
                value={customStatus || ""}
                onChange={(e) => setCustomStatus(e.target.value || null)}
                maxLength={128}
              />
              <button
                onClick={() => updateStatus()}
                className="bg-dark-5 rounded px-3 py-2 text-white hover:bg-dark-6 flex-none"
              >
                Save
              </button>
            </div>
          </div>
          <div className="mb-10">
            <div className="text-lg font-medium text-gray-300 mb-1">
              Interaction Endpoint
            </div>
            <div className="text-gray-400 font-light text-sm mb-5">
              To increase the speed and reliability of your bot, you can set the
              Interaction Endpoint URL in the Discord Developer Portal:
            </div>
            <input
              type="url"
              readOnly
              value={customBot.data.interaction_endpoint_url}
              className="bg-dark-2 px-3 py-2 rounded w-full focus:outline-none text-white mb-5"
            />
            <a
              href={`https://discord.com/developers/applications/${customBot.data.application_id}/information`}
              target="_blank"
              className="bg-blurple hover:bg-blurple-dark px-3 py-2 rounded text-white"
            >
              Open Developer Portal
            </a>
          </div>
          <div className="flex justify-end space-x-3">
            <button
              className="px-3 py-2 rounded border-2 border-red hover:bg-red cursor-pointer text-white"
              onClick={disable}
            >
              Disable
            </button>
            <button
              className="px-3 py-2 rounded border-2 border-dark-7 hover:bg-dark-6 cursor-pointer text-white"
              onClick={() => setConfigure(true)}
            >
              Change Token
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

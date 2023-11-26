import { useCustomBotQuery } from "../api/queries";
import { useSendSettingsStore } from "../state/sendSettings";
import {
  CheckCircleIcon,
  SparklesIcon,
  XCircleIcon,
} from "@heroicons/react/24/solid";
import { userAvatarUrl } from "../util/discord";
import { useEffect, useState } from "react";
import { usePremiumGuildFeatures } from "../util/premium";
import {
  useCustomBotConfigureMutation,
  useCustomBotDisableMutation,
  useCustomBotUpdatePresenceMutation,
} from "../api/mutations";
import { useToasts } from "../util/toasts";
import PremiumSuggest from "./PremiumSuggest";
import { ArrowPathIcon } from "@heroicons/react/20/solid";
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

  function updateStatus(newStatus: string, newCustomStatus?: string | null) {
    if (!guildId) return;

    updatePresenceMutation.mutate(
      {
        guildId,
        req: {
          gateway_status: newStatus,
          gateway_activity_type: !!newCustomStatus ? 4 : undefined,
          gateway_activity_name: newCustomStatus || undefined,
          gateway_activity_state: newCustomStatus || undefined,
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

  function cycleStatus() {
    let newStatus: string;
    switch (status) {
      case "online":
        newStatus = "dnd";
        break;
      case "dnd":
        newStatus = "invisible";
        break;
      case "invisible":
        newStatus = "online";
        break;
    }

    updateStatus(newStatus, customStatus);
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
            <div className="flex items-center space-x-5">
              <div className="relative flex-none">
                <img
                  src={userAvatarUrl({
                    id: customBot.data.user_id,
                    avatar: customBot.data.user_avatar,
                    discriminator: customBot.data.user_discriminator,
                  })}
                  alt=""
                  className="h-16 w-16 rounded-full shadow"
                />
                <div
                  className="h-6 w-6 bg-dark-3 rounded-full absolute right-0 bottom-0 flex items-center justify-center cursor-pointer"
                  title="Change Status"
                  onClick={cycleStatus}
                >
                  <div
                    className={clsx(
                      "h-5 w-5 rounded-full flex items-center justify-center",
                      status === "online"
                        ? "bg-green"
                        : status === "dnd"
                        ? "bg-red"
                        : "bg-gray-500"
                    )}
                  >
                    <ArrowPathIcon className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <div className="text-xl text-gray-300 mb-1">
                    {customBot.data.user_name}
                  </div>
                  <div className="text-sm text-gray-500 hidden sm:block">
                    {customBot.data.user_id}
                  </div>
                </div>
                <div className="flex">
                  <input
                    className="px-3 py-1 text-sm bg-dark-2 w-full rounded-l focus:outline-none text-gray-300 flex-auto"
                    placeholder="Custom Status"
                    value={customStatus || ""}
                    onChange={(e) => setCustomStatus(e.target.value || null)}
                    maxLength={128}
                  />
                  <button
                    onClick={() => updateStatus(status, customStatus)}
                    className="bg-blurple rounded-r px-2 py-1 text-white hover:bg-blurple-dark flex-none"
                  >
                    Set Status
                  </button>
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
                    The interaction endpoint has been configured correctly in
                    the Discord Developer Portal
                  </div>
                </>
              ) : (
                <>
                  <XCircleIcon className="h-6 w-6 text-red" />
                  <div>
                    The interaction endpoint hasn't been configured correctly in
                    the Discord Developer Portal
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
              Interaction Endpoint
            </div>
            <div className="text-gray-400 font-light text-sm mb-5">
              You need to open up your bot in the Discord Developer Portal and
              set the Interaction Endpoint URL to this value:
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

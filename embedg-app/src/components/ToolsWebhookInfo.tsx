import { useState } from "react";
import { userAvatarUrl } from "../discord/cdn";

interface Webhook {
  application_id: string | null;
  avatar: string | null;
  channel_id: string;
  guild_id: string;
  id: string;
  name: string;
  token: string;
  type: number;
  user: {
    id: string;
    username: string;
    discriminator: string;
    global_name: string | null;
    avatar: string | null;
  } | null;
}

export default function ToolsWebhookInfo() {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookInfo, setWebhookInfo] = useState<Webhook>();
  const [error, setError] = useState<string>();

  function getWebhookInfo() {
    if (!webhookUrl) return;

    setWebhookInfo(undefined);
    setError(undefined);

    fetch(webhookUrl)
      .then((res) => {
        if (!res.ok)
          throw new Error(
            "Failed to get Webhook, does the webhook still exist?"
          );
        return res.json();
      })
      .then((data) => setWebhookInfo(data))
      .catch((err) => setError(`${err}`));
  }

  return (
    <div className="space-y-5">
      <div className="flex space-x-3">
        <input
          type="url"
          className="bg-dark-2 rounded px-3 py-2 w-full focus:outline-none text-gray-100 placeholder:font-light placeholder-gray-500"
          placeholder="https://discord.com/api/webhooks/..."
          value={webhookUrl}
          onChange={(e) => setWebhookUrl(e.target.value)}
        />
        <button
          className="bg-blurple hover:bg-blurple-dark rounded px-3 py-2 text-gray-100 flex-none"
          onClick={getWebhookInfo}
        >
          Get Info
        </button>
      </div>
      {error && <div className="text-red">{error}</div>}
      {webhookInfo && (
        <div className="bg-dark-3 p-5 rounded-md">
          <div className="flex items-center space-x-4 mb-10">
            <img
              src={userAvatarUrl({
                id: webhookInfo.id,
                avatar: webhookInfo.avatar,
                discriminator: "0",
              })}
              className="h-20 w-20 rounded-full"
              alt=""
            />
            <div>
              <div className="text-xl font-medium text-gray-100">
                {webhookInfo.name}
              </div>
              <div className="text-gray-400 font-light">{webhookInfo.id}</div>
            </div>
          </div>

          <div className="grid grid-cols-3">
            {webhookInfo.user && (
              <div>
                <div className="font-bold text-gray-100 mb-2">Created by</div>
                <div className="flex">
                  <div className="p-2 border-2 border-dark-5 flex items-center space-x-3 rounded">
                    <img
                      src={userAvatarUrl(webhookInfo.user)}
                      className="h-10 w-10 rounded-full"
                      alt=""
                    />
                    <div>
                      <div className="font-medium text-gray-100">
                        {webhookInfo.user.username}
                      </div>
                      <div className="text-gray-400 font-light text-xs">
                        {webhookInfo.user.id}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <div className="font-bold text-gray-100 mb-2">Guild ID</div>
              <div className="text-gray-300">{webhookInfo.guild_id}</div>
            </div>
            <div>
              <div className="font-bold text-gray-100 mb-2">Channel ID</div>
              <div className="text-gray-300">{webhookInfo.channel_id}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

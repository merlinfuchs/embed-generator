import type { DiscordSDK } from "@discord/embedded-app-sdk";
import { AuthExchangeResponseWire } from "../api/wire";
import queryClient, { setLocalSessionToken } from "../api/client";
import { useActivityStateStore } from "../state/activity";

export const isDiscordActivity =
  import.meta.env.VITE_DISCORD_ACTIVITY === "true";

let discordSdk: DiscordSDK;

async function setupSdk() {
  if (discordSdk) return;

  const lib = await import("@discord/embedded-app-sdk");

  discordSdk = new lib.DiscordSDK(import.meta.env.VITE_DISCORD_CLIENT_ID);

  await discordSdk.ready();

  document.addEventListener("click", interceptLinkClicks);

  const { code } = await discordSdk.commands.authorize({
    client_id: import.meta.env.VITE_DISCORD_CLIENT_ID,
    response_type: "code",
    state: "",
    prompt: "none",
    scope: ["identify", "guilds"],
  });

  const tokenData: AuthExchangeResponseWire = await fetch(
    "/api/auth/exchange",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code }),
    }
  ).then((res) => res.json());
  if (!tokenData || !tokenData.success) {
    console.error("Failed to exchange code for token");
    throw new Error("Failed to exchange code for token");
  }

  setLocalSessionToken(tokenData.data.session_token);

  const auth = await discordSdk.commands.authenticate({
    access_token: tokenData.data.access_token,
  });
  console.log("Authenticated", auth);

  await queryClient.invalidateQueries();
}

function interceptLinkClicks(e: MouseEvent) {
  const target = e.target as HTMLElement;
  if (target.tagName === "A" && target.getAttribute("target") === "_blank") {
    e.preventDefault();

    let url = target.getAttribute("href")!;
    if (url.startsWith("/")) {
      url = `https://${import.meta.env.VITE_PUBLIC_HOST}${url}`;
    }

    discordSdk.commands.openExternalLink({ url });
  }
}

if (isDiscordActivity) {
  useActivityStateStore.setState({ loading: true });

  setupSdk()
    .catch((e) => {
      console.error(e);
      useActivityStateStore.setState({ error: `Failed to authenticate: ${e}` });
    })
    .finally(() => {
      useActivityStateStore.setState({ loading: false });
    });
}

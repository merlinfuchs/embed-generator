import React from "react";
import {
  CheckCircleIcon,
  MegaphoneIcon,
} from "@heroicons/react/24/solid";
import {
  CursorArrowRippleIcon,
  HashtagIcon,
  PaperClipIcon,
  PencilSquareIcon,
  Squares2X2Icon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { Avatar } from "../../../components/discord";
import {
  Callout,
  ClosingCta,
  Faq,
  Features,
  Hero,
  LandingPage,
  Questions,
  Section,
  Steps,
} from "../../../components/landing";

const TITLE = "Discord Webhook Sender: Send Messages and Embeds | Embed Generator";
const DESCRIPTION =
  "Send messages, embeds and Components V2 layouts to a Discord webhook from a visual editor. Create the webhook, paste the URL and send. Free, no bot and no code.";
const EDITOR = { label: "Open the editor", href: "/app/editor" };

const steps = [
  {
    title: "Create a webhook in Discord",
    text: "In the server settings, open Integrations → Webhooks and click New Webhook. Pick the channel it should post to and click Copy Webhook URL. You need the Manage Webhooks permission.",
  },
  {
    title: "Paste the URL into the editor",
    text: "Open the editor, choose Webhook in the send menu and paste the URL. No login and no bot needed.",
  },
  {
    title: "Build the message and send",
    text: "Write the text, add embeds and images, set a name and avatar, then click Send Message. It shows up in the channel right away.",
  },
];

const features = [
  {
    icon: Squares2X2Icon,
    name: "Embeds and Components V2",
    text: "Titles, fields, images and colors, or sections, thumbnails and separators. The preview updates as you type.",
    href: "/docs/features/components-v2",
  },
  {
    icon: UserCircleIcon,
    name: "Any name and avatar",
    text: "Every message can post under its own name and picture, so one webhook can be Mod Team today and Event Bot tomorrow.",
    href: "/docs/features/custom-branding",
  },
  {
    icon: PencilSquareIcon,
    name: "Edit after sending",
    text: "Paste a message link to load a sent message back into the editor and update it in place.",
  },
  {
    icon: HashtagIcon,
    name: "Threads and forum posts",
    text: "Paste a thread ID to post inside a thread or reply in an existing forum post.",
  },
  {
    icon: PaperClipIcon,
    name: "Files and images",
    text: "Attach files and images to the message, alongside the embeds.",
  },
  {
    icon: MegaphoneIcon,
    name: "Fluxer too",
    text: "Fluxer webhooks take the same messages. Paste a Fluxer webhook URL and send.",
    href: "/docs/features/fluxer",
  },
];

const faq: Faq[] = [
  {
    q: "Can I edit a webhook message after sending it?",
    a: "Yes, as long as the same webhook sent it. Right-click the message in Discord, choose Copy Message Link and paste it into Message ID or URL. Restore Message loads it into the editor and Edit Message replaces it. Sending again always posts a new message.",
  },
  {
    q: "How do I send to a thread or forum post?",
    a: "Turn on Developer Mode under User Settings → Advanced, right-click the thread or forum post, choose Copy Thread ID and paste it into Thread ID.",
  },
  {
    q: "How long can a webhook message be?",
    a: "Up to 2,000 characters of text and up to 10 embeds, with 6,000 characters across all of them. Files, images, link buttons and Components V2 layouts work too.",
  },
  {
    q: "Do I need an account?",
    a: "No. Sending to a webhook works without logging in. You only need to log in for things that need the bot, like buttons that hand out roles.",
  },
  {
    q: "What if my webhook URL leaks?",
    a: "Anyone with the URL can post to the channel and delete the webhook. Discord can't reset the URL, so delete the webhook under Integrations → Webhooks and create a new one.",
  },
  {
    q: "Where did this webhook URL come from?",
    a: "Paste it into the Webhook Info tool. It shows the webhook's name, avatar, server and who created it.",
    link: { label: "Webhook Info", href: "/app/tools/webhook-info" },
  },
];

const curl = `curl -X POST "https://discord.com/api/webhooks/ID/TOKEN?wait=true" \\
  -H "Content-Type: application/json" \\
  -d '{
    "username": "Deploy Bot",
    "content": "Deploy finished",
    "embeds": [{ "title": "v2.4.1 is live", "color": 5763719 }]
  }'`;

// The editor's webhook send menu next to the message it produces. Send replays the delivery.
function SendPreview(): JSX.Element {
  const [sends, setSends] = React.useState(0);
  const [sending, setSending] = React.useState(false);

  function send() {
    if (sending) return;
    setSending(true);
    window.setTimeout(() => {
      setSending(false);
      setSends((n) => n + 1);
    }, 600);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-solid border-white/5 bg-ink-800 p-5 shadow-card">
        <div className="mb-4 inline-flex rounded-lg bg-ink-900 p-1 text-sm">
          <span className="rounded-md bg-ink-700 px-3 py-1 font-medium text-mist-100">
            Webhook
          </span>
          <span className="px-3 py-1 text-mist-500">Channel</span>
        </div>
        <div className="mb-1.5 text-xs font-medium uppercase text-mist-400">
          Webhook URL
        </div>
        <div className="mb-4 truncate rounded-lg bg-ink-900 px-3 py-2 font-mono text-sm text-mist-300">
          https://discord.com/api/webhooks/1197103400257589359/hCwS2ogxf1epTg-jfwOySzD6ti
        </div>
        <div className="flex items-center justify-end gap-3">
          {sends > 0 && !sending && (
            <span className="flex items-center gap-1.5 text-sm text-[#57F287]">
              <CheckCircleIcon className="h-4 w-4" />
              Message has been sent
            </span>
          )}
          <button
            type="button"
            onClick={send}
            className="flex cursor-pointer items-center gap-2 rounded-lg border-0 bg-azure-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-azure-400"
          >
            {sending && (
              <span className="h-2 w-2 animate-ping rounded-full bg-white" />
            )}
            Send Message
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-solid border-white/5 bg-discord-bg p-5 shadow-card">
        <div className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-mist-400">
          <HashtagIcon className="h-4 w-4" />
          announcements
        </div>
        <div
          key={sends}
          className={`flex gap-4 ${sends > 0 ? "animate-[fadeIn_400ms_ease-out]" : ""}`}
        >
          <Avatar icon={MegaphoneIcon} color="bg-azure-500" />
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2 text-sm">
              <span className="font-medium text-mist-100">Community Team</span>
              <span className="rounded bg-discord-button px-1.5 py-px text-[10px] font-semibold uppercase leading-4 text-white">
                App
              </span>
              <span className="text-xs text-mist-500">Today at 9:41</span>
            </div>
            <div className="text-sm text-discord-text">
              Season 3 starts this Friday! 🎉
            </div>
            <div className="mt-1 max-w-md rounded-md border-0 border-l-4 border-solid border-azure-500 bg-discord-embed p-4">
              <div className="mb-1 text-base font-semibold text-mist-100">
                Patch notes: Season 3
              </div>
              <div className="text-sm leading-relaxed text-mist-300">
                New maps, a ranked mode and a reworked shop. Full notes are on
                the website.
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="font-semibold text-mist-100">Starts</div>
                  <div className="text-mist-300">Friday, 6 PM UTC</div>
                </div>
                <div>
                  <div className="font-semibold text-mist-100">Downtime</div>
                  <div className="text-mist-300">About 30 minutes</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DiscordWebhook(): JSX.Element {
  return (
    <LandingPage title={TITLE} description={DESCRIPTION} faq={faq}>
      <Hero
        title={
          <>
            Discord <span className="text-azure-400">Webhook Sender</span>
          </>
        }
        text="A Discord webhook is a URL that posts messages into one channel, no bot required. Build the message in a visual editor, paste the webhook URL and send it with any name and avatar."
        cta={EDITOR}
        stats={[
          { value: "Free", label: "no account needed" },
          { value: "10", label: "embeds per message" },
          { value: "Any", label: "name and avatar" },
        ]}
        aside={<SendPreview />}
      />
      <Steps
        title="Send a webhook message in three steps."
        steps={steps}
        image={{
          src: "/img/features/discord-webhooks/create-webhook.png",
          alt: "Creating a webhook under Integrations in Discord's server settings",
        }}
      />
      <Features title="Everything a webhook can send." features={features} />
      <Callout
        icon={CursorArrowRippleIcon}
        title="Want buttons that do something?"
        text="A webhook can only send. It can't read the channel, react or respond to a click, because Discord delivers clicks to the app that owns the message. For buttons that hand out roles, select menus and replies, add the Embed Generator bot and send to a channel instead."
        link={{
          label: "Interactive components",
          href: "/docs/guides/interactive-components",
        }}
      />
      <Section title="Send to a webhook from code.">
        <p className="mb-6 mt-0 max-w-2xl leading-relaxed text-mist-400">
          A webhook takes a JSON POST, so a script or CI job can use it
          directly. With <code>wait=true</code> Discord answers with the created
          message, including the ID you need to edit it later with a{" "}
          <code>PATCH</code> to <code>/webhooks/ID/TOKEN/messages/ID</code>.
          Without it the response is an empty 204.
        </p>
        <pre className="m-0 overflow-x-auto rounded-2xl border border-solid border-white/5 bg-ink-950 p-5 text-sm leading-relaxed text-mist-300 shadow-card">
          <code>{curl}</code>
        </pre>
        <p className="mb-0 mt-6 max-w-2xl text-sm leading-relaxed text-mist-400">
          Designed a message in the editor? Open <strong>JSON Code</strong>{" "}
          there and copy the JSON to send it from your own code.
        </p>
      </Section>
      <Questions faq={faq} />
      <ClosingCta
        title="Got a webhook URL?"
        text="Paste it into the editor and send your first message."
        cta={EDITOR}
      />
    </LandingPage>
  );
}

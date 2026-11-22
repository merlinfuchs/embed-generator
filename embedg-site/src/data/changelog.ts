// What changed in Embed Generator, newest first. Shown on /changelog.
//
// A PR that users would notice adds a change under the day it's merged, newest day first. Bigger
// changes get a text and a link. Small ones only get a title and show as a list under the day.

export interface Change {
  title: string;
  text?: string;
  href?: string;
}

export interface ChangeDay {
  // YYYY-MM-DD
  date: string;
  changes: Change[];
}

export const changelog: ChangeDay[] = [
  {
    date: "2026-11-22",
    changes: [
      {
        title: "Forms",
        text: "Forms are pop-ups that ask members to type an answer or pick options, members, roles, or channels. A button, select menu, or custom command opens one with the Show Form action, and the answers can go into the reply. Every server gets 3 forms for free, 10 with Embed Generator Premium, and 25 with Ultimate.",
        href: "/docs/guides/forms",
      },
      {
        title: "Form answers for your team",
        text: "Post Answers to a Channel sends every answer to a staff channel, and Send Answers to URL passes them to Zapier, n8n, Make, or your own server. Both need Premium.",
        href: "/docs/guides/forms#sending-answers-to-other-tools",
      },
      { title: "The sidebar scrolls on short screens" },
    ],
  },
  {
    date: "2026-11-21",
    changes: [
      {
        title: "Polls",
        text: "A message can carry a poll with up to 10 answers, shown below the embeds.",
        href: "/docs/features/polls",
      },
      {
        title: "Timestamp Generator",
        text: "Pick a date, time, and timezone and copy a timestamp that shows in each reader's own timezone.",
        href: "/app/tools/timestamps",
      },
      {
        title: "Snowflake Decoder",
        text: "Paste any Discord ID to see when it was created, or turn a date into an ID.",
        href: "/app/tools/snowflake",
      },
      {
        title: "Discord's new text colors",
        text: "The Colored Text Generator uses the colors Discord switched to in August, and adds italic and strikethrough.",
        href: "/app/tools/colored-text",
      },
      {
        title: "Time of sending for embed timestamps",
        text: "An embed's timestamp can be the time the message goes out instead of a fixed date.",
      },
      {
        title: "Install the app",
        text: "Embed Generator can be installed from the browser like an app, on desktop and on phones.",
      },
      { title: "Threads and forum posts are collapsed under their channel" },
      { title: "The emoji picker shows the emojis of the server you picked" },
      { title: "Cmd+Z and Cmd+Shift+Z undo and redo on a Mac" },
      { title: "Dates in the preview use your own date format" },
      { title: "Code blocks show correctly in the preview" },
    ],
  },
  {
    date: "2026-11-14",
    changes: [
      {
        title: "Phishing protection for Embed Links",
        text: "Embed Links can't lead to sites on the phish.sinking.yachts list or go through link shorteners. A link whose site is added to the list later shows \"Link blocked\" in Discord.",
        href: "/app/tools/embed-links",
      },
      {
        title: "A line under link previews",
        text: "Embed Links with a custom component end with a \"Link preview from message.style\" line, so a link can't pass as the poster's own message. It's left out of links created by someone who bought Premium or Ultimate.",
      },
      { title: "/message dump attaches the message as a JSON file" },
    ],
  },
  {
    date: "2026-11-10",
    changes: [
      {
        title: "Select menus that reset",
        text: "Turn on Clear after use and a select menu goes back to its placeholder after each pick, so members can pick the same option twice.",
      },
    ],
  },
  {
    date: "2026-11-09",
    changes: [
      {
        title: "Files in the preview",
        text: "Attachments show up in the editor's preview, and File components have a paperclip button that attaches the file.",
      },
    ],
  },
  {
    date: "2026-10-30",
    changes: [
      {
        title: "One free recurring scheduled message",
        text: "Free servers can have 1 scheduled message that repeats or goes out on more than one date. More of them need Premium.",
        href: "/features/scheduled-messages",
      },
      {
        title: "Open Discohook links",
        text: "Links with ?data= from Embed Generator or Discohook open in the editor. Change the domain of a Discohook link to message.style and it opens here.",
        href: "/docs/guides/message-links",
      },
    ],
  },
  {
    date: "2026-10-27",
    changes: [
      {
        title: "Sending after switching servers goes to the right channel",
      },
    ],
  },
  {
    date: "2026-10-26",
    changes: [
      {
        title: "Publish scheduled messages in announcement channels",
        text: "A scheduled message in an announcement channel can be published to the servers that follow it.",
      },
    ],
  },
  {
    date: "2026-10-16",
    changes: [{ title: "Inline code keeps its spaces in the preview" }],
  },
  {
    date: "2026-10-09",
    changes: [
      {
        title: "Up to 40 components",
        text: "Components V2 messages can hold 40 components, the same as Discord allows. Imported messages with layouts open in Components V2 mode.",
        href: "/features/components-v2",
      },
    ],
  },
  {
    date: "2026-10-08",
    changes: [
      {
        title: "Rebuilt scheduled messages",
        text: "Schedules can repeat every few minutes, hours, days, weeks, or months, or go out on a list of dates. You set them up as a sentence with a preview, see them on a calendar, and can send a test before saving.",
        href: "/docs/guides/scheduled-messages",
      },
      {
        title: "Send to another channel",
        text: "Buttons, select menus, and commands can post their reply in another channel, like a report that goes to a staff channel. Replies can also be built right in the action instead of picking a saved message. Both need Premium.",
        href: "/features/interactive-components",
      },
      {
        title: "Timestamps in variables",
        text: "discordTimestamp turns a time into a Discord timestamp that every reader sees in their own timezone.",
        href: "/docs/guides/variables",
      },
    ],
  },
  {
    date: "2026-10-07",
    changes: [
      {
        title: "Ultimate",
        text: "Ultimate costs $9.99 a month per server and has everything in Premium with higher limits, like 500 saved messages and 100 scheduled messages. When you reach a limit, the app shows what the next plan includes.",
        href: "/docs/premium",
      },
      {
        title: "Why a scheduled message failed",
        text: "The list of scheduled messages shows why the last send failed or why a schedule was turned off. Messages that Discord rejects aren't retried anymore.",
      },
      {
        title: "Channel picker hints",
        text: "A greyed out channel shows whether you or the bot is missing Manage Webhooks there, with a link to the fix.",
        href: "/docs/guides/channel-permissions",
      },
      { title: "Invalid messages get an error that says what's wrong" },
      { title: "Embed timestamps are checked in the editor" },
    ],
  },
  {
    date: "2026-10-02",
    changes: [
      {
        title: "Earlier versions of saved messages",
        text: "Overwriting a saved message keeps the old version, and History lets you preview and restore it. Premium keeps 5 versions of each message and Ultimate keeps 50.",
        href: "/docs/features/save-messages",
      },
    ],
  },
  {
    date: "2026-09-30",
    changes: [
      {
        title: "Templates for new messages",
        text: "Starting a new message opens a dialog with 6 templates, a blank message, and the AI assistant. It starts in Components V2, and you can switch to embeds.",
      },
      {
        title: "Layouts and link buttons through webhooks",
        text: "Messages sent through a webhook can include link buttons and every Components V2 layout. Only buttons and select menus with actions still need the bot.",
        href: "/docs/guides/send-modes",
      },
      {
        title: "Fluxer webhooks",
        text: "Paste a Fluxer webhook URL to send, edit, and restore messages there.",
        href: "/blog/fluxer-embeds",
      },
    ],
  },
  {
    date: "2026-09-29",
    changes: [
      {
        title: "The AI assistant becomes a chat",
        text: "The assistant sits next to the editor. Describe what you want and it edits the whole message, then keep asking for changes. Free servers get 5 prompts a month.",
        href: "/docs/features/ai-assistant",
      },
    ],
  },
  {
    date: "2026-09-28",
    changes: [
      {
        title: "Voice, stage, and media channels",
        text: "Messages can go to the text chat of voice and stage channels, and start a new post in media channels like in forums.",
      },
      {
        title: "Clearer permission errors",
        text: "When the bot or you can't reach a server or channel, the editor says which permission is missing and who's missing it.",
      },
    ],
  },
  {
    date: "2026-09-25",
    changes: [
      {
        title: "Scheduled messages that edit",
        text: "A scheduled message can edit an existing message on each run instead of sending a new one. Each schedule also has its own timezone, so admins in other countries see the same times.",
        href: "/docs/guides/scheduled-messages",
      },
      {
        title: "Choose who gets pinged",
        text: "The cog in the editor's menu bar opens Message Settings, where you pick whether users, roles, and @everyone get pinged.",
      },
    ],
  },
  {
    date: "2026-09-23",
    changes: [
      { title: "Formatting buttons in Components V2 text displays" },
    ],
  },
  {
    date: "2025-07-28",
    changes: [
      {
        title: "Components V2",
        text: "Build messages with Discord's newer layouts: containers, sections, separators, and media galleries.",
        href: "/features/components-v2",
      },
    ],
  },
  {
    date: "2025-02-27",
    changes: [{ title: "Discord timestamps show in the preview" }],
  },
  {
    date: "2024-12-15",
    changes: [{ title: "Scheduled messages can start forum posts" }],
  },
  {
    date: "2024-11-28",
    changes: [
      {
        title: "Lifetime plans",
        text: "Premium can be bought once instead of every month, and activated on one server.",
        href: "/docs/premium",
      },
    ],
  },
  {
    date: "2024-08-14",
    changes: [
      {
        title: "Messages from your custom bot",
        text: "With a custom bot, messages sent to a channel come from your bot's name and avatar.",
        href: "/docs/features/white-label",
      },
      { title: "Subtext in messages and the preview" },
    ],
  },
  {
    date: "2024-05-26",
    changes: [
      {
        title: "Check Permissions action",
        text: "Buttons and select menus only run their actions for members with the permissions you pick.",
        href: "/docs/guides/interactive-components",
      },
    ],
  },
  {
    date: "2024-05-21",
    changes: [
      {
        title: "Variables with conditions",
        text: "Variables in messages and replies can use conditions and functions, and can remember values between clicks.",
        href: "/docs/guides/variables",
      },
    ],
  },
  {
    date: "2024-04-29",
    changes: [
      {
        title: "Embed Links",
        text: "Create a link that unfurls in Discord as an embed, without a webhook.",
        href: "/app/tools/embed-links",
      },
      { title: "Undo and redo in the editor" },
      { title: "Restore buttons and select menus from a message in Discord" },
    ],
  },
  {
    date: "2024-01-21",
    changes: [
      {
        title: "Colored Text Generator and Webhook Info",
        text: "Two tools: one colors text in Discord with code blocks, the other shows the name, server, and creator behind a webhook URL.",
        href: "/docs/tools",
      },
    ],
  },
  {
    date: "2024-01-17",
    changes: [
      {
        title: "Scheduled messages",
        text: "Send a message later, or on a recurring schedule. Embed Generator was used by over 100,000 servers by then.",
        href: "/features/scheduled-messages",
      },
      { title: "Send to forum channels and private threads" },
    ],
  },
  {
    date: "2023-11-23",
    changes: [
      {
        title: "Image uploads",
        text: "Upload images for your embeds instead of linking to them.",
      },
    ],
  },
  {
    date: "2023-10-14",
    changes: [
      {
        title: "Custom bots and custom commands",
        text: "Connect your own bot so replies come from its name and avatar, and give your members slash commands that reply with your messages.",
        href: "/docs/features/custom-commands",
      },
      {
        title: "Embed Generator Premium in Discord",
        text: "Premium is bought in Discord's store instead of on the website.",
        href: "/docs/premium",
      },
      {
        title: "AI assistant",
        text: "Describe a message and the AI builds it in the editor.",
      },
      { title: "Emoji picker for buttons and select menus" },
    ],
  },
  {
    date: "2023-05-08",
    changes: [
      {
        title: "A new Embed Generator",
        text: "The editor and the bot are rebuilt from scratch. The editor moves to message.style/app, buttons and select menus run actions like giving roles, and Discohook backups can be imported.",
      },
    ],
  },
  {
    date: "2022-08-07",
    changes: [
      {
        title: "Buttons that give roles",
        text: "A button can toggle a role on the member who clicks it.",
      },
      { title: "Share a message with a link" },
    ],
  },
  {
    date: "2022-06-15",
    changes: [
      {
        title: "Open source on GitHub",
        text: "A new version of the editor and bot is published on GitHub, with a live preview, a JSON editor, buttons and select menus, and saved messages.",
        href: "/source",
      },
    ],
  },
  {
    date: "2018-02-05",
    changes: [
      {
        title: "The first Embed Generator",
        text: "You built a message by filling in a Google Form, and the bot posted it to your channel. A simple web form replaced the Google Form later, and that version stayed until the new editor in 2022.",
      },
    ],
  },
];

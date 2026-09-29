import type { GetPremiumPlanFeaturesResponseDataWire } from "../api/wire";
import { getUniqueId } from "../util";
import { getRelativeUrl } from "../util/url";
import { parseMessageWithAction } from "./importSchema";
import {
  COMPONENTS_V2_FLAG,
  type Message,
  type MessageComponent,
} from "./schema";

export interface MessageTemplate {
  id: string;
  group: "Embeds" | "Components V2" | "Interactive";
  name: string;
  description: string;
  /** The accent of the message, for its card. */
  color: number;
  /** Builds the message with fresh ids, so using a template twice doesn't share action sets. */
  build: () => Message;
}

// Discord's brand colors, which the banners use too.
const BLURPLE = 0x5865f2;
const GREEN = 0x57f287;
const YELLOW = 0xfee75c;
const RED = 0xed4245;
const PURPLE = 0x9b59b6;
const FUCHSIA = 0xeb459e;

/** A banner in public/templates, linked from this instance so it serves its own copy. */
function banner(name: string): string {
  return `${location.origin}${getRelativeUrl(`/templates/${name}.webp`)}`;
}

// Embeds put their image at the bottom, so a banner on top is an embed of its own.
const bannerEmbed = (name: string, color: number) => ({
  image: { url: banner(name) },
  color,
});

const bannerGallery = (name: string) => ({
  type: 12,
  items: [{ media: { url: banner(name) } }],
});

// Link buttons need a valid URL, and this one is obviously meant to be replaced.
const PLACEHOLDER_URL = "https://example.com";

/** 8 PM a week from now, for the event templates. */
function nextWeekEvening(): number {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  date.setHours(20, 0, 0, 0);
  return Math.floor(date.getTime() / 1000);
}

function v2(components: unknown[]): Message {
  return parseMessageWithAction({
    flags: COMPONENTS_V2_FLAG,
    components,
  });
}

const textDisplay = (content: string) => ({ type: 10, content });

const linkButton = (label: string, emoji: string) => ({
  type: 2,
  style: 5,
  label,
  emoji: { name: emoji, animated: false },
  url: PLACEHOLDER_URL,
});

const linkSection = (content: string, label: string, emoji: string) => ({
  type: 9,
  components: [textDisplay(content)],
  accessory: linkButton(label, emoji),
});

export const messageTemplates: MessageTemplate[] = [
  {
    id: "rules",
    group: "Embeds",
    name: "Server rules",
    description: "A numbered list of rules with a footer",
    color: RED,
    build: () =>
      parseMessageWithAction({
        embeds: [
          bannerEmbed("rules", RED),
          {
            title: "📜 Server Rules",
            description:
              "To keep this a place everyone enjoys, please follow these rules. The moderators have the final say.",
            color: RED,
            fields: [
              {
                name: "1. Be respectful",
                value:
                  "No harassment, hate speech or personal attacks. Treat others the way you want to be treated.",
              },
              {
                name: "2. No spam",
                value:
                  "Don't flood the chat, and keep self-promotion to the channels meant for it.",
              },
              {
                name: "3. Keep it safe for work",
                value: "No NSFW content anywhere on the server.",
              },
              {
                name: "4. Use the right channels",
                value: "Check the channel topic before posting.",
              },
              {
                name: "5. Follow Discord's rules",
                value:
                  "The [Terms of Service](https://discord.com/terms) and [Community Guidelines](https://discord.com/guidelines) apply here too.",
              },
            ],
            footer: {
              text: "Breaking the rules can get you muted, kicked or banned.",
            },
          },
        ],
      }),
  },
  {
    id: "welcome",
    group: "Embeds",
    name: "Welcome",
    description: "Greets new members and points them around",
    color: BLURPLE,
    build: () =>
      parseMessageWithAction({
        content: "Welcome to the server! 👋",
        embeds: [
          bannerEmbed("welcome", BLURPLE),
          {
            title: "Welcome to Your Server",
            description:
              "We're glad you're here. Here's everything you need to get started.",
            color: BLURPLE,
            fields: [
              {
                name: "📜 Rules",
                value: "Read them in #rules",
                inline: true,
              },
              {
                name: "🎭 Roles",
                value: "Pick yours in #roles",
                inline: true,
              },
              {
                name: "💬 Chat",
                value: "Say hi in #general",
                inline: true,
              },
            ],
            footer: { text: "Have fun!" },
          },
        ],
      }),
  },
  {
    id: "announcement",
    group: "Embeds",
    name: "Announcement",
    description: "News for your members with a date",
    color: YELLOW,
    build: () =>
      parseMessageWithAction({
        embeds: [
          bannerEmbed("announcement", YELLOW),
          {
            title: "📣 Big News",
            description:
              "Describe what's happening here. You can use **bold**, *italics*, [links](https://example.com) and lists:\n\n- What changes\n- When it happens\n- What members need to do",
            color: YELLOW,
            timestamp: new Date().toISOString(),
            footer: { text: "The Team" },
          },
        ],
      }),
  },
  {
    id: "patch-notes",
    group: "Embeds",
    name: "Patch notes",
    description: "What's new, changed and fixed in an update",
    color: GREEN,
    build: () =>
      parseMessageWithAction({
        embeds: [
          bannerEmbed("update", GREEN),
          {
            title: "Update 1.2.0",
            description: "Here's everything that changed in this update.",
            color: GREEN,
            fields: [
              {
                name: "✨ New",
                value: "- The first new feature\n- The second new feature",
              },
              {
                name: "🛠️ Changed",
                value: "- Something that works differently now",
              },
              {
                name: "🐛 Fixed",
                value: "- A bug that no longer happens",
              },
            ],
            timestamp: new Date().toISOString(),
          },
        ],
      }),
  },
  {
    id: "event",
    group: "Embeds",
    name: "Event",
    description: "Time and place, shown in each member's timezone",
    color: PURPLE,
    build: () => {
      const time = nextWeekEvening();
      return parseMessageWithAction({
        embeds: [
          bannerEmbed("event", PURPLE),
          {
            title: "🎮 Game Night",
            description:
              "Join us for a night of games! Everyone's welcome, no matter your skill level.",
            color: PURPLE,
            fields: [
              { name: "📅 When", value: `<t:${time}:f>`, inline: true },
              { name: "⏰ Starts", value: `<t:${time}:R>`, inline: true },
              { name: "📍 Where", value: "#voice-chat", inline: true },
            ],
          },
        ],
      });
    },
  },
  {
    id: "v2-guide",
    group: "Components V2",
    name: "Server guide",
    description: "Sections with buttons that link to the important places",
    color: BLURPLE,
    build: () =>
      v2([
        {
          type: 17,
          accent_color: BLURPLE,
          components: [
            bannerGallery("welcome"),
            textDisplay(
              "# Welcome to Your Server\nEverything you need to find your way around.",
            ),
            linkSection(
              "### 📜 Rules\nRead them before you start chatting.",
              "Rules",
              "📜",
            ),
            linkSection(
              "### 🎭 Roles\nPick the roles for what you're into.",
              "Roles",
              "🎭",
            ),
            linkSection(
              "### 💬 Support\nStuck? Ask us anything.",
              "Support",
              "💬",
            ),
          ],
        },
      ]),
  },
  {
    id: "v2-news",
    group: "Components V2",
    name: "News card",
    description: "An announcement in a container with a link",
    color: YELLOW,
    build: () =>
      v2([
        {
          type: 17,
          accent_color: YELLOW,
          components: [
            bannerGallery("announcement"),
            textDisplay(
              "## 📣 Big News\nDescribe what's happening here. Text displays support **markdown**, headings and lists:\n- What changes\n- When it happens",
            ),
            {
              type: 1,
              components: [linkButton("Read more", "🔗")],
            },
          ],
        },
        textDisplay("-# Posted by the team"),
      ]),
  },
  {
    id: "v2-event",
    group: "Components V2",
    name: "Event card",
    description: "Event details with a button to the event",
    color: PURPLE,
    build: () => {
      const time = nextWeekEvening();
      return v2([
        {
          type: 17,
          accent_color: PURPLE,
          components: [
            bannerGallery("event"),
            textDisplay(
              "## 🎮 Game Night\nJoin us for a night of games! Everyone's welcome, no matter your skill level.",
            ),
            textDisplay(
              `**📅 When:** <t:${time}:f> (<t:${time}:R>)\n**📍 Where:** #voice-chat`,
            ),
            {
              type: 1,
              components: [linkButton("Event page", "📅")],
            },
          ],
        },
      ]);
    },
  },
  {
    id: "roles",
    group: "Interactive",
    name: "Role selection",
    description: "Buttons that give or take roles when clicked",
    color: FUCHSIA,
    build: () => {
      const buttons = [
        { label: "Announcements", emoji: "📣" },
        { label: "Events", emoji: "🎉" },
        { label: "Giveaways", emoji: "🎁" },
      ].map(({ label, emoji }) => ({
        type: 2,
        style: 2,
        label,
        emoji: { name: emoji, animated: false },
        action_set_id: getUniqueId().toString(),
      }));

      return parseMessageWithAction({
        embeds: [
          bannerEmbed("roles", FUCHSIA),
          {
            title: "🎭 Pick your roles",
            description:
              "Click a button to get pinged for what you're interested in. Click it again to remove the role.",
            color: FUCHSIA,
          },
        ],
        components: [{ type: 1, components: buttons }],
        // The roles are the server's own, so they are left for the user to
        // pick. Until they do, the editor won't send the message.
        actions: Object.fromEntries(
          buttons.map((b) => [
            b.action_set_id,
            { actions: [{ type: 2, target_id: "" }] },
          ]),
        ),
      });
    },
  },
];

function hasInteractive(components: MessageComponent[]): boolean {
  return components.some(
    (c) =>
      c.type === 3 ||
      (c.type === 2 && c.style !== 5) ||
      ("accessory" in c && hasInteractive([c.accessory])) ||
      ("components" in c && hasInteractive(c.components)),
  );
}

/**
 * Whether the message has buttons with actions or select menus. Webhooks send
 * everything else, but only the bot can handle those.
 */
export function needsBot(message: Message): boolean {
  return hasInteractive(message.components);
}

/** Whether the message can be sent, which for one that needs the bot takes a plan to check. */
export function templateAvailable(
  message: Message,
  features: GetPremiumPlanFeaturesResponseDataWire | null,
): boolean {
  if (!needsBot(message)) return true;
  if (!features) return false;

  return Object.values(message.actions).every(
    (set) => set.actions.length <= features.max_actions_per_component,
  );
}

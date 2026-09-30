import type { GetPremiumPlanFeaturesResponseDataWire } from "../api/wire";
import { getUniqueId } from "../util";
import { getRelativeUrl } from "../util/url";
import { parseMessageWithAction } from "./importSchema";
import {
  COMPONENTS_V2_FLAG,
  type Message,
  type MessageComponent,
} from "./schema";

export type TemplateFormat = "componentsV2" | "embeds";

export interface MessageTemplate {
  id: string;
  name: string;
  description: string;
  /** Builds the message with fresh ids, so using a template twice doesn't share action sets. */
  build: Record<TemplateFormat, () => Message>;
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

function embeds(message: object): Message {
  return parseMessageWithAction(message);
}

/** A Components V2 message of one container, and what goes below it. */
function container(
  accentColor: number,
  components: unknown[],
  { after = [], actions = {} }: { after?: unknown[]; actions?: object } = {},
): Message {
  return parseMessageWithAction({
    flags: COMPONENTS_V2_FLAG,
    components: [{ type: 17, accent_color: accentColor, components }, ...after],
    actions,
  });
}

const textDisplay = (content: string) => ({ type: 10, content });

const separator = { type: 14, divider: true, spacing: 1 };

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

const RULES: [string, string][] = [
  [
    "1. Be respectful",
    "No harassment, hate speech or personal attacks. Treat others the way you want to be treated.",
  ],
  [
    "2. No spam",
    "Don't flood the chat, and keep self-promotion to the channels meant for it.",
  ],
  ["3. Keep it safe for work", "No NSFW content anywhere on the server."],
  ["4. Use the right channels", "Check the channel topic before posting."],
  [
    "5. Follow Discord's rules",
    "The [Terms of Service](https://discord.com/terms) and [Community Guidelines](https://discord.com/guidelines) apply here too.",
  ],
];
const RULES_INTRO =
  "To keep this a place everyone enjoys, please follow these rules. The moderators have the final say.";
const RULES_FOOTER = "Breaking the rules can get you muted, kicked or banned.";

const WELCOME_INTRO =
  "We're glad you're here. Here's everything you need to get started.";
const WELCOME_LINKS: [string, string, string, string][] = [
  ["📜", "Rules", "Read them before you start chatting.", "#rules"],
  ["🎭", "Roles", "Pick the roles for what you're into.", "#roles"],
  ["💬", "Chat", "Say hi to everyone.", "#general"],
];

const NEWS_TEXT =
  "Describe what's happening here. You can use **bold**, *italics*, [links](https://example.com) and lists:\n\n- What changes\n- When it happens\n- What members need to do";

const PATCH_NOTES: [string, string][] = [
  ["✨ New", "- The first new feature\n- The second new feature"],
  ["🛠️ Changed", "- Something that works differently now"],
  ["🐛 Fixed", "- A bug that no longer happens"],
];

const EVENT_TEXT =
  "Join us for a night of games! Everyone's welcome, no matter your skill level.";

/** Buttons that toggle roles, with the actions to go with them. */
function roleButtons() {
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

  return {
    row: { type: 1, components: buttons },
    // The roles are the server's own, so they are left for the user to pick.
    // Until they do, the editor won't send the message.
    actions: Object.fromEntries(
      buttons.map((b) => [
        b.action_set_id,
        { actions: [{ type: 2, target_id: "" }] },
      ]),
    ),
  };
}

const ROLES_TEXT =
  "Click a button to get pinged for what you're interested in. Click it again to remove the role.";

export const messageTemplates: MessageTemplate[] = [
  {
    id: "rules",
    name: "Server rules",
    description: "A numbered list of rules with a footer",
    build: {
      componentsV2: () =>
        container(RED, [
          bannerGallery("rules"),
          textDisplay(`## 📜 Server Rules\n${RULES_INTRO}`),
          separator,
          textDisplay(
            RULES.map(([name, value]) => `**${name}**\n${value}`).join("\n\n"),
          ),
          separator,
          textDisplay(`-# ${RULES_FOOTER}`),
        ]),
      embeds: () =>
        embeds({
          embeds: [
            bannerEmbed("rules", RED),
            {
              title: "📜 Server Rules",
              description: RULES_INTRO,
              color: RED,
              fields: RULES.map(([name, value]) => ({ name, value })),
              footer: { text: RULES_FOOTER },
            },
          ],
        }),
    },
  },
  {
    id: "welcome",
    name: "Welcome",
    description: "Greets new members and points them around",
    build: {
      componentsV2: () =>
        container(BLURPLE, [
          bannerGallery("welcome"),
          textDisplay(`# Welcome to Your Server\n${WELCOME_INTRO}`),
          separator,
          ...WELCOME_LINKS.map(([emoji, name, text]) =>
            linkSection(`### ${emoji} ${name}\n${text}`, name, emoji),
          ),
        ]),
      embeds: () =>
        embeds({
          content: "Welcome to the server! 👋",
          embeds: [
            bannerEmbed("welcome", BLURPLE),
            {
              title: "Welcome to Your Server",
              description: WELCOME_INTRO,
              color: BLURPLE,
              fields: WELCOME_LINKS.map(([emoji, name, , channel]) => ({
                name: `${emoji} ${name}`,
                value: channel,
                inline: true,
              })),
              footer: { text: "Have fun!" },
            },
          ],
        }),
    },
  },
  {
    id: "announcement",
    name: "Announcement",
    description: "News for your members with a link",
    build: {
      componentsV2: () =>
        container(
          YELLOW,
          [
            bannerGallery("announcement"),
            textDisplay(`## 📣 Big News\n${NEWS_TEXT}`),
            { type: 1, components: [linkButton("Read more", "🔗")] },
          ],
          { after: [textDisplay("-# Posted by the team")] },
        ),
      embeds: () =>
        embeds({
          embeds: [
            bannerEmbed("announcement", YELLOW),
            {
              title: "📣 Big News",
              description: NEWS_TEXT,
              color: YELLOW,
              timestamp: new Date().toISOString(),
              footer: { text: "The Team" },
            },
          ],
        }),
    },
  },
  {
    id: "patch-notes",
    name: "Patch notes",
    description: "What's new, changed and fixed in an update",
    build: {
      componentsV2: () =>
        container(GREEN, [
          bannerGallery("update"),
          textDisplay(
            "## Update 1.2.0\nHere's everything that changed in this update.",
          ),
          separator,
          ...PATCH_NOTES.map(([name, value]) =>
            textDisplay(`### ${name}\n${value}`),
          ),
        ]),
      embeds: () =>
        embeds({
          embeds: [
            bannerEmbed("update", GREEN),
            {
              title: "Update 1.2.0",
              description: "Here's everything that changed in this update.",
              color: GREEN,
              fields: PATCH_NOTES.map(([name, value]) => ({ name, value })),
              timestamp: new Date().toISOString(),
            },
          ],
        }),
    },
  },
  {
    id: "event",
    name: "Event",
    description: "Time and place, shown in each member's timezone",
    build: {
      componentsV2: () => {
        const time = nextWeekEvening();
        return container(PURPLE, [
          bannerGallery("event"),
          textDisplay(`## 🎮 Game Night\n${EVENT_TEXT}`),
          separator,
          textDisplay(
            `**📅 When:** <t:${time}:f> (<t:${time}:R>)\n**📍 Where:** #voice-chat`,
          ),
          { type: 1, components: [linkButton("Event page", "📅")] },
        ]);
      },
      embeds: () => {
        const time = nextWeekEvening();
        return embeds({
          embeds: [
            bannerEmbed("event", PURPLE),
            {
              title: "🎮 Game Night",
              description: EVENT_TEXT,
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
  },
  {
    id: "roles",
    name: "Role selection",
    description: "Buttons that give or take roles when clicked",
    build: {
      componentsV2: () => {
        const { row, actions } = roleButtons();
        return container(
          FUCHSIA,
          [
            bannerGallery("roles"),
            textDisplay(`## 🎭 Pick your roles\n${ROLES_TEXT}`),
            row,
          ],
          { actions },
        );
      },
      embeds: () => {
        const { row, actions } = roleButtons();
        return embeds({
          embeds: [
            bannerEmbed("roles", FUCHSIA),
            {
              title: "🎭 Pick your roles",
              description: ROLES_TEXT,
              color: FUCHSIA,
            },
          ],
          components: [row],
          actions,
        });
      },
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

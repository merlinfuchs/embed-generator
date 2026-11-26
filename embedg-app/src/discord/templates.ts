import type {
  EmbedTemplateDataWire,
  GetPremiumPlanFeaturesResponseDataWire,
} from "../api/wire";
import { getUniqueId } from "../util";
import { getRelativeUrl } from "../util/url";
import { parseMessageWithAction } from "./importSchema";
import {
  COMPONENTS_V2_FLAG,
  type Message,
  type MessageComponent,
} from "./schema";

export type TemplateFormat = "componentsV2" | "embeds";

/** Something the user picks before the template is used, like the role a button gives. */
export interface TemplateField {
  id: string;
  label: string;
  type: "role" | "channel";
}

/** What a template is built from. Fields left out keep their placeholders. */
export interface TemplateInput {
  values: Partial<Record<string, string>>;
  guildId: string | null;
  /** What the server found at the link, for a template built from one. */
  link?: EmbedTemplateDataWire;
}

/**
 * A template filled in from a link, like a YouTube video. The server looks the
 * link up, which takes a login.
 */
export interface TemplateLink {
  /** The server's name for the site. */
  provider: string;
  label: string;
  placeholder: string;
  /** Rejects links to other sites before asking the server. */
  hosts: string[];
}

export const EMPTY_TEMPLATE_INPUT: TemplateInput = {
  values: {},
  guildId: null,
};

export interface MessageTemplate {
  id: string;
  name: string;
  description: string;
  fields?: TemplateField[];
  link?: TemplateLink;
  /** Builds the message with fresh ids, so using a template twice doesn't share action sets. */
  build: Record<TemplateFormat, (input: TemplateInput) => Message>;
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

const bannerGalleryUrl = (url: string) => ({
  type: 12,
  items: [{ media: { url } }],
});

const bannerGallery = (name: string) => bannerGalleryUrl(banner(name));

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

const linkButton = (label: string, emoji: string, url = PLACEHOLDER_URL) => ({
  type: 2,
  style: 5,
  label,
  emoji: { name: emoji, animated: false },
  url,
});

const linkSection = (
  content: string,
  label: string,
  emoji: string,
  url?: string,
) => ({
  type: 9,
  components: [textDisplay(content)],
  accessory: linkButton(label, emoji, url),
});

/** A mention of the picked channel, or the placeholder until one is. */
function channelMention(input: TemplateInput, field: string, fallback: string) {
  const id = input.values[field];
  return id ? `<#${id}>` : fallback;
}

/** A link that opens the picked channel, or the placeholder until one is. */
function channelUrl(input: TemplateInput, field: string) {
  const id = input.values[field];
  return id && input.guildId
    ? `https://discord.com/channels/${input.guildId}/${id}`
    : PLACEHOLDER_URL;
}

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
const WELCOME_LINKS = [
  {
    emoji: "📜",
    name: "Rules",
    text: "Read them before you start chatting.",
    field: "rulesChannel",
    placeholder: "#rules",
  },
  {
    emoji: "🎭",
    name: "Roles",
    text: "Pick the roles for what you're into.",
    field: "rolesChannel",
    placeholder: "#roles",
  },
  {
    emoji: "💬",
    name: "Chat",
    text: "Say hi to everyone.",
    field: "chatChannel",
    placeholder: "#general",
  },
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

const ROLE_BUTTONS = [
  { label: "Announcements", emoji: "📣", field: "announcementsRole" },
  { label: "Events", emoji: "🎉", field: "eventsRole" },
  { label: "Giveaways", emoji: "🎁", field: "giveawaysRole" },
];

/** Buttons that toggle roles, with the actions to go with them. */
function roleButtons(input: TemplateInput) {
  const buttons = ROLE_BUTTONS.map(({ label, emoji, field }) => ({
    field,
    component: {
      type: 2,
      style: 2,
      label,
      emoji: { name: emoji, animated: false },
      action_set_id: getUniqueId().toString(),
    },
  }));

  return {
    row: { type: 1, components: buttons.map((b) => b.component) },
    // The roles are the server's own. Until the user picks them, the editor
    // won't send the message.
    actions: Object.fromEntries(
      buttons.map((b) => [
        b.component.action_set_id,
        { actions: [{ type: 2, target_id: input.values[b.field] ?? "" }] },
      ]),
    ),
  };
}

const ROLES_TEXT =
  "Click a button to get pinged for what you're interested in. Click it again to remove the role.";

/** Keeps a title from closing the markdown link it sits in. */
function escapeLinkText(text: string): string {
  return text.replace(/([[\]\\])/g, "\\$1");
}

/** A markdown link to `url`, or just the text without one. */
function mdLink(text: string, url: string): string {
  return text && url ? `[${escapeLinkText(text)}](${url})` : text;
}

interface LinkTemplateStyle {
  color: number;
  /** Goes in front of the title, like the other templates' headings. */
  emoji: string;
  button: { label: string; emoji: string };
  /** The line under the heading. */
  intro: (d: EmbedTemplateDataWire) => string;
  /** Shown as "**📺 Channel:** ..." lines, or fields in an embed. */
  details: (d: EmbedTemplateDataWire) => [string, string][];
  /** Stands in for what the server finds, until a link is looked up. */
  sample: () => EmbedTemplateDataWire;
}

/** The heading, which has to stay within Discord's 256 characters for a title. */
function linkHeading(style: LinkTemplateStyle, d: EmbedTemplateDataWire) {
  return Array.from(`${style.emoji} ${d.title}`).slice(0, 256).join("");
}

/**
 * The message for a link, laid out like the other templates: the picture as a
 * banner on top, the title as the heading, the details below a separator and
 * a button that opens the link. A square cover, like Spotify's, sits next to
 * the text instead.
 */
function linkTemplateBuild(style: LinkTemplateStyle): MessageTemplate["build"] {
  const data = (input: TemplateInput) => input.link ?? style.sample();
  // A detail the site didn't give, like a missing author, is left out.
  const detailsOf = (d: EmbedTemplateDataWire) =>
    style.details(d).filter(([, value]) => value);

  return {
    embeds: (input) => {
      const d = data(input);
      return embeds({
        embeds: [
          ...(d.image_url
            ? [{ image: { url: d.image_url }, color: style.color }]
            : []),
          {
            title: linkHeading(style, d),
            url: d.url,
            description: style.intro(d),
            color: style.color,
            thumbnail: d.thumbnail_url ? { url: d.thumbnail_url } : undefined,
            fields: detailsOf(d).map(([name, value]) => ({
              name,
              value,
              inline: true,
            })),
            footer: { text: d.provider_name },
          },
        ],
      });
    },
    componentsV2: (input) => {
      const d = data(input);
      // The title links to the page, like an embed's title does.
      const heading = textDisplay(
        `## ${style.emoji} ${mdLink(d.title, d.url)}\n${style.intro(d)}`,
      );
      const details = detailsOf(d);

      return container(style.color, [
        ...(d.image_url ? [bannerGalleryUrl(d.image_url)] : []),
        d.thumbnail_url
          ? {
              type: 9,
              components: [heading],
              accessory: { type: 11, media: { url: d.thumbnail_url } },
            }
          : heading,
        ...(details.length > 0
          ? [
              separator,
              textDisplay(
                details
                  .map(([name, value]) => `**${name}:** ${value}`)
                  .join("\n"),
              ),
            ]
          : []),
        {
          type: 1,
          components: [
            linkButton(style.button.label, style.button.emoji, d.url),
          ],
        },
      ]);
    },
  };
}

function sample(
  providerName: string,
  data: Partial<EmbedTemplateDataWire>,
): EmbedTemplateDataWire {
  return {
    provider: "",
    provider_name: providerName,
    title: "",
    url: PLACEHOLDER_URL,
    description: "",
    author_name: "",
    author_url: "",
    author_icon_url: "",
    image_url: "",
    thumbnail_url: "",
    fields: [],
    ...data,
  };
}

/** Whether the link is on one of the sites the template is for. */
export function linkMatchesTemplate(link: TemplateLink, raw: string): boolean {
  const value = raw.trim();
  if (!value) return false;

  try {
    const url = new URL(value.includes("://") ? value : `https://${value}`);
    const host = url.hostname.toLowerCase().replace(/^(www|m|music)\./, "");
    return link.hosts.includes(host);
  } catch {
    return false;
  }
}

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
    fields: WELCOME_LINKS.map(({ name, field }) => ({
      id: field,
      label: `${name} channel`,
      type: "channel",
    })),
    build: {
      componentsV2: (input) =>
        container(BLURPLE, [
          bannerGallery("welcome"),
          textDisplay(`# Welcome to Your Server\n${WELCOME_INTRO}`),
          separator,
          ...WELCOME_LINKS.map(({ emoji, name, text, field }) =>
            linkSection(
              `### ${emoji} ${name}\n${text}`,
              name,
              emoji,
              channelUrl(input, field),
            ),
          ),
        ]),
      embeds: (input) =>
        embeds({
          content: "Welcome to the server! 👋",
          embeds: [
            bannerEmbed("welcome", BLURPLE),
            {
              title: "Welcome to Your Server",
              description: WELCOME_INTRO,
              color: BLURPLE,
              fields: WELCOME_LINKS.map(
                ({ emoji, name, field, placeholder }) => ({
                  name: `${emoji} ${name}`,
                  value: channelMention(input, field, placeholder),
                  inline: true,
                }),
              ),
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
    fields: [
      { id: "eventChannel", label: "Where it happens", type: "channel" },
    ],
    build: {
      componentsV2: (input) => {
        const time = nextWeekEvening();
        return container(PURPLE, [
          bannerGallery("event"),
          textDisplay(`## 🎮 Game Night\n${EVENT_TEXT}`),
          separator,
          textDisplay(
            `**📅 When:** <t:${time}:f> (<t:${time}:R>)\n**📍 Where:** ${channelMention(input, "eventChannel", "#voice-chat")}`,
          ),
          { type: 1, components: [linkButton("Event page", "📅")] },
        ]);
      },
      embeds: (input) => {
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
                {
                  name: "📍 Where",
                  value: channelMention(input, "eventChannel", "#voice-chat"),
                  inline: true,
                },
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
    fields: ROLE_BUTTONS.map(({ label, emoji, field }) => ({
      id: field,
      label: `Role for ${emoji} ${label}`,
      type: "role",
    })),
    build: {
      componentsV2: (input) => {
        const { row, actions } = roleButtons(input);
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
      embeds: (input) => {
        const { row, actions } = roleButtons(input);
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
  {
    id: "youtube",
    name: "YouTube video",
    description:
      "Paste a video and its title, channel and thumbnail are filled in",
    link: {
      provider: "youtube",
      label: "YouTube link",
      placeholder: "https://www.youtube.com/watch?v=...",
      hosts: ["youtube.com", "youtu.be"],
    },
    build: linkTemplateBuild({
      color: 0xff0000,
      emoji: "▶️",
      button: { label: "Watch on YouTube", emoji: "▶️" },
      intro: () => "A new video is out! Grab a snack and give it a watch.",
      details: (d) => [["📺 Channel", mdLink(d.author_name, d.author_url)]],
      sample: () =>
        sample("YouTube", {
          title: "The title of the video",
          author_name: "Channel name",
          image_url: banner("video"),
        }),
    }),
  },
  {
    id: "vimeo",
    name: "Vimeo video",
    description:
      "Paste a video and its title, creator and thumbnail are filled in",
    link: {
      provider: "vimeo",
      label: "Vimeo link",
      placeholder: "https://vimeo.com/...",
      hosts: ["vimeo.com", "player.vimeo.com"],
    },
    build: linkTemplateBuild({
      color: 0x1ab7ea,
      emoji: "🎬",
      button: { label: "Watch on Vimeo", emoji: "🎬" },
      intro: (d) =>
        d.description ||
        "A new video is out! Grab a snack and give it a watch.",
      details: (d) => [["🎥 Creator", mdLink(d.author_name, d.author_url)]],
      sample: () =>
        sample("Vimeo", {
          title: "The title of the video",
          description: "What the video is about.",
          author_name: "Creator name",
          image_url: banner("film"),
        }),
    }),
  },
  {
    id: "spotify",
    name: "Spotify",
    description:
      "Paste a song, album, playlist or podcast to share it with its cover",
    link: {
      provider: "spotify",
      label: "Spotify link",
      placeholder: "https://open.spotify.com/track/...",
      hosts: ["open.spotify.com"],
    },
    build: linkTemplateBuild({
      color: 0x1db954,
      emoji: "🎵",
      button: { label: "Listen on Spotify", emoji: "🎧" },
      intro: () => "Here's something worth a listen. Turn it up!",
      // The server says what it is, like "Song on Spotify".
      details: (d) => [["🎧 Type", d.description.replace(/ on Spotify$/, "")]],
      sample: () =>
        sample("Spotify", {
          title: "The name of the song",
          description: "Song on Spotify",
          thumbnail_url: banner("music"),
        }),
    }),
  },
  {
    id: "github",
    name: "GitHub repository",
    description:
      "Paste a repository and its description, stars and language are filled in",
    link: {
      provider: "github",
      label: "GitHub link",
      placeholder: "https://github.com/owner/repository",
      hosts: ["github.com"],
    },
    build: linkTemplateBuild({
      color: 0x238636,
      emoji: "📦",
      button: { label: "View on GitHub", emoji: "🔗" },
      intro: (d) => d.description || "Check out this repository on GitHub.",
      details: (d) => [
        ["👤 Owner", mdLink(d.author_name, d.author_url)],
        ...d.fields.map((f): [string, string] => [f.name, f.value]),
      ],
      sample: () =>
        sample("GitHub", {
          title: "owner/repository",
          description: "What the repository is about.",
          author_name: "owner",
          image_url: banner("repository"),
          fields: [
            { name: "⭐ Stars", value: "1,234" },
            { name: "🍴 Forks", value: "56" },
            { name: "💻 Language", value: "Go" },
          ],
        }),
    }),
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

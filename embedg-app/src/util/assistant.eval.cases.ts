import type { Features } from "./assistant";
import type { Message, MessageComponent } from "../discord/schema";

// What the assistant is expected to do: build or change the message, ask
// for what only the user knows, or answer without changing anything. Cases
// where either is fine list both.
export type EvalRoute = "build" | "clarify" | "answer";

export interface EvalCase {
  name: string;
  prompt: string;
  route: EvalRoute[];
  // The message in the editor, the default message if left out.
  message?: Message;
  features?: Features;
  // For questions: send the suggested request afterwards, like clicking
  // "Build this".
  thenBuild?: boolean;
  // Problems with what was built, if it was.
  check?: (message: Message) => string[];
}

export const premiumFeatures: Features = {
  components_v2: true,
  component_types: [1, 2, 3, 9, 10, 11, 12, 13, 14, 17],
  max_actions_per_component: 5,
};

const freeFeatures: Features = {
  components_v2: false,
  component_types: [1, 2, 3],
  max_actions_per_component: 2,
};

export const evalGuild = {
  name: "Pixel Raiders",
  roles: [
    { id: "1100000000000000001", name: "Moderator" },
    { id: "1100000000000000002", name: "Member" },
    { id: "1100000000000000003", name: "Red" },
    { id: "1100000000000000004", name: "Blue" },
    { id: "1100000000000000005", name: "Green" },
    { id: "1100000000000000006", name: "Event Pings" },
  ],
  emojis: [
    { id: "1200000000000000001", name: "pixel_heart", animated: false },
    { id: "1200000000000000002", name: "party_parrot", animated: true },
  ],
  saved_messages: [
    { id: "faqMsg01", name: "FAQ" },
    { id: "rulesMsg", name: "Rules" },
  ],
};

const role = (name: string) =>
  evalGuild.roles.find((r) => r.name === name)?.id ?? "";

const empty: Message = {
  content: "",
  tts: false,
  embeds: [],
  components: [],
  actions: {},
  flags: 0,
};

const welcomeEmbed: Message = {
  ...empty,
  embeds: [
    {
      id: 1,
      title: "Welcome to Pixel Raiders!",
      description: "Grab a snack and say hi in chat.",
      color: 0x5865f2,
      fields: [],
    },
  ],
};

const joinButton: Message = {
  ...welcomeEmbed,
  components: [
    {
      id: 2,
      type: 1,
      components: [
        {
          id: 3,
          type: 2,
          style: 1,
          label: "Get Member",
          action_set_id: "4242",
        },
      ],
    },
  ],
  actions: {
    "4242": {
      actions: [
        {
          id: 5,
          type: 3,
          target_id: role("Member"),
          public: false,
          allow_role_mentions: false,
          disable_default_response: false,
        },
      ],
    },
  },
};

function components(message: Message): MessageComponent[] {
  const all: MessageComponent[] = [];
  const walk = (list: MessageComponent[]) => {
    for (const c of list) {
      all.push(c);
      if (c.type === 9) all.push(c.accessory);
      if ("components" in c) walk(c.components);
    }
  };
  walk(message.components);
  return all;
}

function actions(message: Message) {
  return Object.values(message.actions).flatMap((s) => s.actions);
}

// Actions without the ids the editor gives them, which change on every parse.
function actionSets(message: Message) {
  return JSON.stringify(message.actions, (key, value) =>
    key === "id" ? undefined : value,
  );
}

function text(message: Message) {
  return JSON.stringify(message);
}

function expect(ok: boolean, problem: string) {
  return ok ? [] : [problem];
}

const eventTime = Date.UTC(2026, 7, 1, 17) / 1000;

export const evalCases: EvalCase[] = [
  {
    name: "welcome message",
    prompt: "Make a welcome message for my gaming server",
    route: ["build"],
    message: empty,
    check: (m) =>
      expect(m.embeds.length > 0 || components(m).length > 0, "empty"),
  },
  {
    name: "rules",
    prompt: "Write server rules with 6 rules in an embed",
    route: ["build"],
    message: empty,
    check: (m) => expect(m.embeds.length > 0, "no embed"),
  },
  {
    name: "role button",
    prompt: "Add a button that gives people the Member role",
    route: ["build"],
    message: welcomeEmbed,
    check: (m) => [
      ...expect(
        actions(m).some(
          (a) =>
            (a.type === 2 || a.type === 3) && a.target_id === role("Member"),
        ),
        "no Member role action",
      ),
      ...expect(
        m.embeds[0]?.title === welcomeEmbed.embeds[0].title,
        "embed changed",
      ),
    ],
  },
  {
    name: "color roles select",
    prompt:
      "Create a select menu where people can pick the Red, Blue or Green role",
    route: ["build"],
    message: empty,
    check: (m) => {
      const menu = components(m).find((c) => c.type === 3);
      return [
        ...expect(
          !!menu && menu.options.length === 3,
          "no menu with 3 options",
        ),
        ...["Red", "Blue", "Green"].flatMap((name) =>
          expect(
            actions(m).some(
              (a) => "target_id" in a && a.target_id === role(name),
            ),
            `no ${name} action`,
          ),
        ),
      ];
    },
  },
  {
    name: "unknown role",
    prompt: "Add a button that gives the VIP role",
    route: ["clarify"],
    message: welcomeEmbed,
  },
  {
    name: "channel mention",
    prompt: "Tell people to read the rules in our rules channel",
    route: ["clarify", "build"],
    message: welcomeEmbed,
  },
  {
    name: "link button",
    prompt: "Add a button that links to our website https://pixelraiders.gg",
    route: ["build"],
    message: welcomeEmbed,
    check: (m) =>
      expect(
        components(m).some(
          (c) =>
            c.type === 2 &&
            c.style === 5 &&
            c.url.startsWith("https://pixelraiders.gg"),
        ),
        "no link button",
      ),
  },
  {
    name: "question about components v2",
    prompt: "What's the difference between embeds and components v2?",
    route: ["answer"],
  },
  {
    name: "question then build",
    prompt: "How can I let members pick the Event Pings role themselves?",
    route: ["answer"],
    thenBuild: true,
    message: welcomeEmbed,
    check: (m) =>
      expect(
        actions(m).some(
          (a) => "target_id" in a && a.target_id === role("Event Pings"),
        ),
        "no Event Pings action",
      ),
  },
  {
    name: "change color",
    prompt: "Make the embed red",
    route: ["build"],
    message: welcomeEmbed,
    check: (m) => {
      const color = m.embeds[0]?.color ?? 0;
      return [
        ...expect(color >> 16 > 0xa0 && (color & 0xffff) < 0x6060, "not red"),
        ...expect(
          m.embeds[0]?.description === welcomeEmbed.embeds[0].description,
          "description changed",
        ),
      ];
    },
  },
  {
    name: "keep actions",
    prompt: "Change the button label to Join and make it green",
    route: ["build"],
    message: joinButton,
    check: (m) => {
      const button = components(m).find((c) => c.type === 2);
      return [
        ...expect(
          !!button && button.type === 2 && button.label === "Join",
          "label not changed",
        ),
        ...expect(
          actionSets(m) === actionSets(joinButton) &&
            !!button &&
            "action_set_id" in button &&
            button.action_set_id === "4242",
          "actions changed",
        ),
      ];
    },
  },
  {
    name: "components v2 announcement",
    prompt:
      "Make an announcement for our summer tournament using components v2, with a header, the prize and a sign up button that gives the Event Pings role",
    route: ["build"],
    message: empty,
    check: (m) => [
      ...expect(!!m.flags && (m.flags & (1 << 15)) !== 0, "not components v2"),
      ...expect(
        actions(m).some(
          (a) => "target_id" in a && a.target_id === role("Event Pings"),
        ),
        "no Event Pings action",
      ),
    ],
  },
  {
    name: "components v2 not in plan",
    prompt: "Use components v2 for this message",
    route: ["answer"],
    message: welcomeEmbed,
    features: freeFeatures,
  },
  {
    name: "saved message response",
    prompt: "Add a FAQ button that answers with our FAQ saved message",
    route: ["build"],
    message: welcomeEmbed,
    check: (m) =>
      expect(
        actions(m).some(
          (a) => (a.type === 5 || a.type === 7) && a.target_id === "faqMsg01",
        ),
        "no FAQ response",
      ),
  },
  {
    name: "dm response",
    prompt: "Add a button that sends the user a DM saying thanks for joining",
    route: ["build"],
    message: welcomeEmbed,
    check: (m) =>
      expect(
        actions(m).some((a) => a.type === 6),
        "no DM action",
      ),
  },
  {
    name: "permission check",
    prompt:
      "Add a Start Event button that only Moderators can use, which posts 'The event has started!' for everyone",
    route: ["build"],
    message: welcomeEmbed,
    check: (m) => {
      const all = actions(m);
      return [
        ...expect(
          all.some(
            (a) => a.type === 10 && a.role_ids.includes(role("Moderator")),
          ),
          "no Moderator check",
        ),
        ...expect(
          all.some((a) => a.type === 1 && a.public),
          "no public response",
        ),
      ];
    },
  },
  {
    name: "too many fields",
    prompt: "Make an embed listing 30 game tips, one field per tip",
    route: ["build", "answer"],
    message: empty,
  },
  {
    name: "image without url",
    prompt: "Add a banner image to the embed",
    route: ["clarify", "answer"],
    message: welcomeEmbed,
  },
  {
    name: "image with url",
    prompt: "Use https://pixelraiders.gg/banner.png as the embed image",
    route: ["build"],
    message: welcomeEmbed,
    check: (m) =>
      expect(
        m.embeds[0]?.image?.url === "https://pixelraiders.gg/banner.png",
        "no image",
      ),
  },
  {
    name: "german",
    prompt: "Erstelle eine Willkommensnachricht für neue Mitglieder",
    route: ["build"],
    message: empty,
  },
  {
    name: "timestamp",
    prompt:
      "Add the event time, 5pm UTC on August 1 2026, shown in everyone's timezone",
    route: ["build"],
    message: welcomeEmbed,
    // The embed's timestamp is shown in everyone's timezone too.
    check: (m) =>
      expect(
        text(m).includes(`<t:${eventTime}`) ||
          m.embeds.some(
            (e) =>
              !!e.timestamp && Date.parse(e.timestamp) === eventTime * 1000,
          ),
        "no timestamp",
      ),
  },
  {
    name: "server emoji",
    prompt: "Add our party parrot emoji to the title",
    route: ["build"],
    message: welcomeEmbed,
    check: (m) =>
      expect(
        text(m).includes("<a:party_parrot:1200000000000000002>"),
        "no emoji",
      ),
  },
  {
    name: "send it",
    prompt: "Send this message to #general",
    route: ["answer", "clarify"],
    message: welcomeEmbed,
  },
  {
    name: "ping everyone",
    prompt: "Ping everyone above the embed",
    route: ["build"],
    message: welcomeEmbed,
    check: (m) => expect(m.content.includes("@everyone"), "no ping"),
  },
  {
    name: "free plan actions",
    prompt:
      "Add a button that gives the Member role, removes the Red role, removes the Blue role and says welcome",
    route: ["build", "answer"],
    message: welcomeEmbed,
    features: freeFeatures,
  },
  {
    name: "broken message",
    prompt: "Add a footer saying 'Have fun!'",
    route: ["build"],
    message: {
      ...welcomeEmbed,
      embeds: [
        { ...welcomeEmbed.embeds[0], fields: [{ id: 9, name: "", value: "" }] },
      ],
    },
    check: (m) =>
      expect(
        m.embeds[0]?.footer?.text?.includes("Have fun") ?? false,
        "no footer",
      ),
  },
];

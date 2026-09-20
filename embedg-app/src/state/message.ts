import debounce from "just-debounce-it";
import { type TemporalState, temporal } from "zundo";
import { create, useStore } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type {
  Message,
  MessageAction,
  MessageComponent,
  MessageComponentAccessory,
  MessageComponentActionRow,
  MessageComponentButton,
  MessageComponentContainer,
  MessageComponentContainerSubComponent,
  MessageComponentFile,
  MessageComponentMediaGallery,
  MessageComponentMediaGalleryItem,
  MessageComponentSection,
  MessageComponentSelectMenu,
  MessageComponentSelectMenuOption,
  MessageComponentSeparator,
  MessageComponentTextDisplay,
} from "../discord/schema";
import { getUniqueId } from "../util";

export interface MessageStore extends Message {
  clear(): void;
  replace(message: Message): void;
  setContent: (content: string) => void;
  setUsername: (username: string | undefined) => void;
  setAvatarUrl: (avatar_url: string | undefined) => void;
  setThreadName: (thread_name: string | undefined) => void;
  getComponentsV2Enabled: () => boolean;
  setComponentsV2Enabled: (enabled: boolean) => void;
}

export const defaultMessage: Message = {
  content:
    'Welcome to **Embed Generator**! 🎉 Create stunning embed messages for your Discord server with ease!\n\nIf you\'re ready to start, simply click on the "Clear" button at the top of the editor and create your own message.\n\nShould you need any assistance or have questions, feel free to join our [support server](/discord) where you can connect with our helpful community members and get the support you need.\n\nWe also have a [complementary bot](/invite) that enhances the experience with Embed Generator. Check out our [Discord bot](/invite) which offers features like formatting for mentions, channels, and emoji, creating reaction roles, interactive components, and more.\n\nLet your creativity shine and make your server stand out with Embed Generator! ✨',
  tts: false,
  embeds: [
    {
      id: 652627557,
      title: "About Embed Generator",
      description:
        "Embed Generator is a powerful tool that enables you to create visually appealing and interactive embed messages for your Discord server. With the use of webhooks, Embed Generator allows you to customize the appearance of your messages and make them more engaging.\n\nTo get started, all you need is a webhook URL, which can be obtained from the 'Integrations' tab in your server's settings. If you encounter any issues while setting up a webhook, our bot can assist you in creating one.\n\nInstead of using webhooks you can also select a server and channel directly here on the website. The bot will automatically create a webhook for you and use it to send the message.",
      color: 2326507,
      fields: [],
    },
    {
      id: 10674342,
      title: "Discord Bot Integration",
      description:
        "Embed Generator offers a Discord bot integration that can further enhance your the functionality. While it is not mandatory for sending messages, having the bot on your server gives you access to a lot more features!\n\nHere are some key features of our bot:",
      color: 2326507,
      fields: [
        {
          id: 472281785,
          name: "Interactive Components",
          value:
            "With our bot on your server you can add interactive components like buttons and select menus to your messages. Just invite the bot to your server, select the right server here on the website and you are ready to go!",
        },
        {
          id: 608893643,
          name: "Special Formatting for Mentions, Channels, and Emoji",
          value:
            "With the /format command, our bot provides special formatting options for mentions, channel tags, and ready-to-use emoji. No more manual formatting errors! Simply copy and paste the formatted text into the editor.",
        },
        {
          id: 724530251,
          name: "Recover Embed Generator Messages",
          value:
            "If you ever need to retrieve a previously sent message created with Embed Generator, our bot can assist you. Right-click or long-press any message in your server, navigate to the apps menu, and select Restore to Embed Generator. You'll receive a link that leads to the editor page with the selected message.",
        },
        {
          id: 927221233,
          name: "Additional Features",
          value:
            "Our bot also supports fetching images from profile pictures or emojis, webhook management, and more. Invite the bot to your server and use the /help command to explore all the available features!",
        },
      ],
    },
  ],
  components: [],
  actions: {},
  flags: 0,
};

export const emptyMessage: Message = {
  content: "",
  tts: false,
  embeds: [],
  components: [],
  actions: {},
};

export const createMessageStore = (key: string) =>
  create<MessageStore>()(
    immer(
      persist(
        temporal(
          (set, get) => ({
            ...defaultMessage,

            clear: () => set(defaultMessage),
            replace: (message: Message) => set(message),
            setContent: (content: string) => set({ content }),
            setUsername: (username: string | undefined) => set({ username }),
            setAvatarUrl: (avatar_url: string | undefined) =>
              set({ avatar_url }),
            setThreadName: (thread_name: string | undefined) =>
              set({ thread_name }),
            getComponentsV2Enabled: () => {
              const state = get();
              const flags = state.flags ?? 0;
              return (flags & (1 << 15)) !== 0;
            },
            setComponentsV2Enabled: (enabled: boolean) => {
              if (enabled) {
                set({
                  content: "",
                  embeds: [],
                  actions: {},
                  components: [],
                  flags: 1 << 15,
                });
              } else {
                set(defaultMessage);
              }
            },
          }),
          {
            limit: 10,
            handleSet: (handleSet) => debounce(handleSet, 1000, true),
          },
        ),
        { name: key, version: 0 },
      ),
    ),
  );

export const MESSAGE_STORE_KEY = "current-message";

export const useCurrentMessageStore = createMessageStore(MESSAGE_STORE_KEY);

export const useCurrentMessageUndoStore = <T>(
  selector: (state: TemporalState<MessageStore>) => T,
) => useStore(useCurrentMessageStore.temporal, selector);

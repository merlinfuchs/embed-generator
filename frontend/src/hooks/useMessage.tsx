import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import { Button, Embed, Message } from "../discord";

export type MessageAction =
  | { type: "setUsername"; value: string | undefined }
  | { type: "setAvatarUrl"; value: string | undefined }
  | { type: "setContent"; value: string | undefined }
  | {
      type: "addEmbed";
      value?: Embed;
    }
  | {
      type: "setEmbed";
      index: number;
      value: Embed;
    }
  | {
      type: "clearEmbeds";
    }
  | {
      type: "removeEmbed";
      index: number;
    }
  | {
      type: "moveEmbedUp";
      index: number;
    }
  | {
      type: "moveEmbedDown";
      index: number;
    }
  | {
      type: "cloneEmbed";
      index: number;
    }
  | {
      type: "setEmbedDescription";
      index: number;
      value: string | undefined;
    }
  | {
      type: "setEmbedTitle";
      index: number;
      value: string | undefined;
    }
  | {
      type: "setEmbedUrl";
      index: number;
      value: string | undefined;
    }
  | {
      type: "setEmbedTimestamp";
      index: number;
      value: string | undefined;
    }
  | {
      type: "setEmbedColor";
      index: number;
      value: number | undefined;
    }
  | {
      type: "setEmbedAuthorName";
      index: number;
      value: string | undefined;
    }
  | {
      type: "setEmbedAuthorUrl";
      index: number;
      value: string | undefined;
    }
  | {
      type: "setEmbedAuthorIconUrl";
      index: number;
      value: string | undefined;
    }
  | {
      type: "setEmbedImageUrl";
      index: number;
      value: string | undefined;
    }
  | {
      type: "setEmbedThumbnailUrl";
      index: number;
      value: string | undefined;
    }
  | {
      type: "setEmbedFooterText";
      index: number;
      value: string | undefined;
    }
  | {
      type: "setEmbedFooterIconUrl";
      index: number;
      value: string | undefined;
    }
  | {
      type: "addEmbedField";
      index: number;
    }
  | {
      type: "clearEmbedFields";
      index: number;
    }
  | {
      type: "removeEmbedField";
      index: number;
      embedIndex: number;
    }
  | {
      type: "moveEmbedFieldUp";
      index: number;
      embedIndex: number;
    }
  | {
      type: "moveEmbedFieldDown";
      index: number;
      embedIndex: number;
    }
  | {
      type: "cloneEmbedField";
      index: number;
      embedIndex: number;
    }
  | {
      type: "setEmbedFieldName";
      index: number;
      embedIndex: number;
      value: string;
    }
  | {
      type: "setEmbedFieldValue";
      index: number;
      embedIndex: number;
      value: string;
    }
  | {
      type: "setEmbedFieldInline";
      index: number;
      embedIndex: number;
      value: boolean;
    }
  | {
      type: "addButton";
      value?: Button;
    }
  | {
      type: "clearButtons";
    }
  | {
      type: "removeButton";
      index: number;
    }
  | {
      type: "moveButtonUp";
      index: number;
    }
  | {
      type: "moveButtonDown";
      index: number;
    }
  | {
      type: "cloneButton";
      index: number;
    }
  | {
      type: "setButtonLabel";
      index: number;
      value: string;
    }
  | {
      type: "setButtonStyle";
      index: number;
      value: Button["style"];
    }
  | {
      type: "setButtonUrl";
      index: number;
      value: string;
    }
  | {
      type: "setButtonCustomId";
      index: number;
      value: string;
    };

// this more-or-less makes sure that we never generate the same id twice
let lastUniqueId = Date.now();

function reducer(msg: Message, action: MessageAction): Message {
  switch (action.type) {
    case "setUsername":
      return { ...msg, username: action.value };
    case "setAvatarUrl":
      return { ...msg, avatar_url: action.value };
    case "setContent":
      return { ...msg, content: action.value };
    case "addEmbed":
      if (msg.embeds.length < 10) {
        return {
          ...msg,
          embeds: [
            ...msg.embeds,
            { id: lastUniqueId++, ...(action.value || { fields: [] }) },
          ],
        };
      } else {
        return msg;
      }
    case "setEmbed": {
      const embeds = [...msg.embeds];
      embeds[action.index] = { id: lastUniqueId++, ...action.value };
      return { ...msg, embeds };
    }
    case "clearEmbeds":
      return { ...msg, embeds: [] };
    case "removeEmbed": {
      const embeds = [...msg.embeds];
      embeds.splice(action.index, 1);
      return { ...msg, embeds };
    }
    case "moveEmbedUp": {
      const embeds = [...msg.embeds];
      [embeds[action.index - 1], embeds[action.index]] = [
        embeds[action.index],
        embeds[action.index - 1],
      ];
      return { ...msg, embeds };
    }
    case "moveEmbedDown": {
      const embeds = [...msg.embeds];
      [embeds[action.index + 1], embeds[action.index]] = [
        embeds[action.index],
        embeds[action.index + 1],
      ];
      return { ...msg, embeds };
    }
    case "cloneEmbed": {
      const embeds = [...msg.embeds];
      const newEmbed = JSON.parse(JSON.stringify(embeds[action.index]));
      newEmbed.id = lastUniqueId++;
      embeds.splice(action.index, 0, newEmbed);
      return { ...msg, embeds };
    }
    case "setEmbedColor": {
      const embeds = [...msg.embeds];
      embeds[action.index] = { ...embeds[action.index], color: action.value };
      return { ...msg, embeds };
    }
    case "setEmbedDescription": {
      const embeds = [...msg.embeds];
      embeds[action.index] = {
        ...embeds[action.index],
        description: action.value,
      };
      return { ...msg, embeds };
    }
    case "setEmbedTitle": {
      const embeds = [...msg.embeds];
      embeds[action.index] = { ...embeds[action.index], title: action.value };
      return { ...msg, embeds };
    }
    case "setEmbedUrl": {
      const embeds = [...msg.embeds];
      embeds[action.index] = { ...embeds[action.index], url: action.value };
      return { ...msg, embeds };
    }
    case "setEmbedTimestamp": {
      const embeds = [...msg.embeds];
      embeds[action.index] = {
        ...embeds[action.index],
        timestamp: action.value,
      };
      return { ...msg, embeds };
    }
    case "setEmbedAuthorName": {
      const embeds = [...msg.embeds];
      const embed = { ...embeds[action.index] };
      if (!action.value && !embed.author?.url && !embed.author?.icon_url) {
        embed.author = undefined;
      } else {
        embed.author = { ...embed.author, name: action.value || "" };
      }
      embeds[action.index] = embed;
      return { ...msg, embeds };
    }
    case "setEmbedAuthorUrl": {
      const embeds = [...msg.embeds];
      const embed = { ...embeds[action.index] };
      if (!action.value && !embed.author?.name && !embed.author?.icon_url) {
        embed.author = undefined;
      } else {
        embed.author = {
          name: embed.author?.name || "",
          url: action.value || "",
          icon_url: embed.author?.icon_url,
        };
      }
      embeds[action.index] = embed;
      return { ...msg, embeds };
    }
    case "setEmbedAuthorIconUrl": {
      const embeds = [...msg.embeds];
      const embed = { ...embeds[action.index] };
      if (!action.value && !embed.author?.name && !embed.author?.url) {
        embed.author = undefined;
      } else {
        embed.author = {
          name: embed.author?.name || "",
          icon_url: action.value || "",
          url: embed.author?.url,
        };
      }
      embeds[action.index] = embed;
      return { ...msg, embeds };
    }
    case "setEmbedImageUrl": {
      const embeds = [...msg.embeds];
      const embed = { ...embeds[action.index] };
      if (action.value) {
        embed.image = { url: action.value };
      } else {
        embed.image = undefined;
      }
      embeds[action.index] = embed;
      return { ...msg, embeds };
    }
    case "setEmbedThumbnailUrl": {
      const embeds = [...msg.embeds];
      const embed = { ...embeds[action.index] };
      if (action.value) {
        embed.thumbnail = { url: action.value };
      } else {
        embed.thumbnail = undefined;
      }
      embeds[action.index] = embed;
      return { ...msg, embeds };
    }
    case "setEmbedFooterText": {
      const embeds = [...msg.embeds];
      const embed = { ...embeds[action.index] };
      if (!action.value && !embed.footer?.icon_url) {
        embed.footer = undefined;
      } else {
        embed.footer = {
          icon_url: embed.footer?.icon_url,
          text: action.value || "",
        };
      }
      embeds[action.index] = embed;
      return { ...msg, embeds };
    }
    case "setEmbedFooterIconUrl": {
      const embeds = [...msg.embeds];
      const embed = { ...embeds[action.index] };
      if (!action.value && !embed.footer?.text) {
        embed.footer = undefined;
      } else {
        embed.footer = {
          text: embed.footer?.text || "",
          icon_url: action.value || "",
        };
      }
      embeds[action.index] = embed;
      return { ...msg, embeds };
    }
    case "addEmbedField": {
      const embeds = [...msg.embeds];
      const embed = { ...embeds[action.index] };
      if (embed.fields.length < 25) {
        embed.fields = [
          ...embed.fields,
          { id: lastUniqueId++, name: "", value: "" },
        ];
        embeds[action.index] = embed;
        return { ...msg, embeds };
      } else {
        return msg;
      }
    }
    case "clearEmbedFields": {
      const embeds = [...msg.embeds];
      const embed = { ...embeds[action.index], fields: [] };
      embeds[action.index] = embed;
      return { ...msg, embeds };
    }
    case "removeEmbedField": {
      const embeds = [...msg.embeds];
      const fields = [...embeds[action.embedIndex].fields];
      fields.splice(action.index, 1);
      embeds[action.embedIndex] = { ...embeds[action.embedIndex], fields };
      return { ...msg, embeds };
    }
    case "moveEmbedFieldUp": {
      const embeds = [...msg.embeds];
      const fields = [...embeds[action.embedIndex].fields];
      [fields[action.index - 1], fields[action.index]] = [
        fields[action.index],
        fields[action.index - 1],
      ];
      embeds[action.embedIndex] = { ...embeds[action.embedIndex], fields };
      return { ...msg, embeds };
    }
    case "moveEmbedFieldDown": {
      const embeds = [...msg.embeds];
      const fields = [...embeds[action.embedIndex].fields];
      [fields[action.index + 1], fields[action.index]] = [
        fields[action.index],
        fields[action.index + 1],
      ];
      embeds[action.embedIndex] = { ...embeds[action.embedIndex], fields };
      return { ...msg, embeds };
    }
    case "cloneEmbedField": {
      const embeds = [...msg.embeds];
      const fields = [...embeds[action.embedIndex].fields];

      const newField = JSON.parse(JSON.stringify(fields[action.index]));
      newField.id = lastUniqueId++;
      fields.splice(action.index, 0, newField);

      embeds[action.embedIndex] = { ...embeds[action.embedIndex], fields };
      return { ...msg, embeds };
    }
    case "setEmbedFieldName": {
      const embeds = [...msg.embeds];
      const fields = [...embeds[action.embedIndex].fields];
      fields[action.index] = {
        ...fields[action.index],
        name: action.value,
      };
      embeds[action.embedIndex] = { ...embeds[action.embedIndex], fields };
      return { ...msg, embeds };
    }
    case "setEmbedFieldValue": {
      const embeds = [...msg.embeds];
      const fields = [...embeds[action.embedIndex].fields];
      fields[action.index] = {
        ...fields[action.index],
        value: action.value,
      };
      embeds[action.embedIndex] = { ...embeds[action.embedIndex], fields };
      return { ...msg, embeds };
    }
    case "setEmbedFieldInline": {
      const embeds = [...msg.embeds];
      const fields = [...embeds[action.embedIndex].fields];
      fields[action.index] = {
        ...fields[action.index],
        inline: action.value,
      };
      embeds[action.embedIndex] = { ...embeds[action.embedIndex], fields };
      return { ...msg, embeds };
    }
    case "addButton": {
      const components = [...msg.components];
      const newButton = {
        id: lastUniqueId++,
        ...(action.value || { type: 2, style: 5, url: "", label: "" }),
      };

      if (components.length === 0) {
        components.push({
          id: lastUniqueId++,
          type: 1,
          components: [newButton],
        });
      } else {
        components[0] = {
          ...components[0],
          components: [...components[0].components, newButton],
        };
      }
      return { ...msg, components };
    }
    case "clearButtons": {
      return { ...msg, components: [] };
    }
    case "moveButtonUp": {
      const components = [...msg.components];
      if (components.length !== 0) {
        const subComponents = [...components[0].components];
        [subComponents[action.index - 1], subComponents[action.index]] = [
          subComponents[action.index],
          subComponents[action.index - 1],
        ];
        components[0] = { ...components[0], components: subComponents };
      }
      return { ...msg, components };
    }
    case "moveButtonDown": {
      const components = [...msg.components];
      if (components.length !== 0) {
        const subComponents = [...components[0].components];
        [subComponents[action.index + 1], subComponents[action.index]] = [
          subComponents[action.index],
          subComponents[action.index + 1],
        ];
        components[0] = { ...components[0], components: subComponents };
      }
      return { ...msg, components };
    }
    case "removeButton": {
      let components = [...msg.components];
      if (components.length !== 0) {
        const subComponents = [...components[0].components];
        subComponents.splice(action.index, 1);
        if (subComponents.length === 0) {
          components = [];
        } else {
          components[0] = { ...components[0], components: subComponents };
        }
      }
      return { ...msg, components };
    }
    case "cloneButton": {
      const components = [...msg.components];
      if (components.length !== 0) {
        const subComponents = [...components[0].components];
        const newButton = JSON.parse(
          JSON.stringify(subComponents[action.index])
        );
        newButton.id = lastUniqueId++;
        subComponents.splice(action.index, 0, newButton);
        components[0] = { ...components[0], components: subComponents };
      }
      return { ...msg, components };
    }
    case "setButtonLabel": {
      const components = [...msg.components];
      if (components.length !== 0) {
        const subComponents = [...components[0].components];
        subComponents[action.index] = {
          ...subComponents[action.index],
          label: action.value,
        };
        components[0] = { ...components[0], components: subComponents };
      }
      return { ...msg, components };
    }
    case "setButtonStyle": {
      const components = [...msg.components];
      if (components.length !== 0) {
        const subComponents = [...components[0].components];
        const component = subComponents[action.index];
        if (action.value === 5) {
          subComponents[action.index] = {
            ...component,
            style: action.value,
            url: component.style === 5 ? component.url : "",
          };
        } else {
          subComponents[action.index] = {
            ...component,
            style: action.value,
            custom_id: component.style !== 5 ? component.custom_id : "",
          };
        }
        components[0] = { ...components[0], components: subComponents };
      }
      return { ...msg, components };
    }
    case "setButtonUrl": {
      const components = [...msg.components];
      if (components.length !== 0) {
        const subComponents = [...components[0].components];
        const component = subComponents[action.index];
        if (component.style === 5) {
          subComponents[action.index] = {
            ...component,
            url: action.value,
          };
        }
        components[0] = { ...components[0], components: subComponents };
      }
      return { ...msg, components };
    }
    case "setButtonCustomId": {
      const components = [...msg.components];
      if (components.length !== 0) {
        const subComponents = [...components[0].components];
        const component = subComponents[action.index];
        if (component.style !== 5) {
          subComponents[action.index] = {
            ...component,
            custom_id: action.value,
          };
        }
        components[0] = { ...components[0], components: subComponents };
      }
      return { ...msg, components };
    }
    default:
      // force switch to be exhaustive at compile time
      ((t: never) => {})(action);
      return msg;
  }
}

const defaultMessage: Message = {
  content: "Welcome to Embed Generator!",
  embeds: [
    {
      id: lastUniqueId++,
      title: "This is an Embed!",
      description: "Embeds are pretty cool if you ask me :)",
      color: 1412061,
      fields: [],
    },
  ],
  components: [],
  files: [],
};

const MessageContext = createContext<
  [Message, (action: MessageAction) => void]
>([defaultMessage, () => {}]);

export const MessageProvider = ({ children }: { children: ReactNode }) => {
  const initialMessage = useMemo(() => {
    const lastMessage = localStorage.getItem("lastMessage");
    if (lastMessage) {
      return JSON.parse(lastMessage);
    } else {
      return defaultMessage;
    }
  }, []);

  const [msg, dispatch] = useReducer(reducer, initialMessage);

  const timeout = useRef<any>();
  useEffect(() => {
    clearTimeout(timeout.current);
    timeout.current = setTimeout(() => {
      const raw = JSON.stringify(msg);
      localStorage.setItem("lastMessage", raw);
    }, 500);
  }, [msg]);

  return (
    <MessageContext.Provider value={[msg, dispatch]}>
      {children}
    </MessageContext.Provider>
  );
};

export default function useMessage(): [
  Message,
  (action: MessageAction) => void
] {
  return useContext(MessageContext);
}

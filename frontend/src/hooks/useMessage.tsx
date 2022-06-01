import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import { Embed, Message } from "../discord";

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
      type: "addEmbedField";
      index: number;
    }
  | {
      type: "clearEmbedFields";
      index: number;
    };

let lastUniqueId = 0;

function reducer(msg: Message, action: MessageAction): Message {
  switch (action.type) {
    case "setUsername":
      return { ...msg, username: action.value };
    case "setAvatarUrl":
      return { ...msg, avatar_url: action.value };
    case "setContent":
      return { ...msg, content: action.value };
    case "addEmbed":
      return {
        ...msg,
        embeds: [
          ...msg.embeds,
          { id: lastUniqueId++, ...(action.value || { fields: [] }) },
        ],
      };
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
    case "addEmbedField": {
      const embeds = [...msg.embeds];
      const embed = { ...embeds[action.index] };
      embed.fields = [...embed.fields, { id: lastUniqueId++ }];
      embeds[action.index] = embed;
      return { ...msg, embeds };
    }
    case "clearEmbedFields": {
      const embeds = [...msg.embeds];
      const embed = { ...embeds[action.index], fields: [] };
      embeds[action.index] = embed;
      return { ...msg, embeds };
    }
    default:
      return msg;
  }
}

const MessageContext = createContext<
  [Message, (action: MessageAction) => void]
>([{ embeds: [], components: [], files: [] }, () => {}]);

export const MessageProvider = ({ children }: { children: ReactNode }) => {
  const initialMessage = useMemo(() => {
    const lastMessage = localStorage.getItem("lastMessage");
    if (lastMessage) {
      return JSON.parse(lastMessage);
    } else {
      return {
        embeds: [],
        components: [],
        files: [],
      };
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

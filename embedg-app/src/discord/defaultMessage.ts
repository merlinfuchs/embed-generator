import { COMPONENTS_V2_FLAG, type Message } from "./schema";

export const defaultMessage: Message = {
  content: "",
  tts: false,
  embeds: [],
  components: [],
  actions: {},
  flags: 0,
};

/** What enabling Components V2 replaces the message with. */
export const emptyComponentsV2Message: Message = {
  ...defaultMessage,
  flags: COMPONENTS_V2_FLAG,
};

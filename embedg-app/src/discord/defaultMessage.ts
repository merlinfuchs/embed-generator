import type { Message } from "./schema";

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
  content: "",
  tts: false,
  embeds: [],
  components: [],
  actions: {},
  flags: 1 << 15,
};

import {
  COMPONENTS_V2_FLAG,
  type Message,
  POLL_DEFAULT_DURATION,
  type Poll,
} from "./schema";

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

/** What adding a poll starts from: Discord needs a question and an answer to choose between. */
export function defaultPoll(): Poll {
  return {
    question: { text: "" },
    answers: [{ poll_media: { text: "" } }, { poll_media: { text: "" } }],
    duration: POLL_DEFAULT_DURATION,
    allow_multiselect: false,
  };
}

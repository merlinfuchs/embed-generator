import { describe, expect, test } from "vitest";
import { parseMessageWithAction } from "./importSchema";
import {
  COMPONENTS_V2_FLAG,
  messageSchema,
  responseMessageSchema,
} from "./schema";

const poll = {
  question: { text: "Pizza or pasta?" },
  answers: [
    { poll_media: { text: "Pizza", emoji: { name: "🍕", animated: false } } },
    { poll_media: { text: "Pasta" } },
  ],
  duration: 24,
  allow_multiselect: false,
};

function issues(message: unknown) {
  const res = messageSchema.safeParse(message);
  return res.success ? [] : res.error.issues;
}

describe("poll", () => {
  test("a poll is enough for a message", () => {
    expect(issues({ poll })).toEqual([]);
  });

  test("a message without content, embeds or a poll is still empty", () => {
    expect(issues({})).not.toEqual([]);
  });

  test("the question and the answers have to be filled in", () => {
    const paths = issues({
      poll: {
        ...poll,
        question: { text: "" },
        answers: [{ poll_media: { text: "" } }],
      },
    }).map((i) => i.path.join("."));

    expect(paths).toContain("poll.question.text");
    expect(paths).toContain("poll.answers.0.poll_media.text");
  });

  test("Discord's limits apply", () => {
    const tooMany = Array.from({ length: 11 }, () => ({
      poll_media: { text: "a" },
    }));

    expect(issues({ poll: { ...poll, answers: tooMany } })).not.toEqual([]);
    expect(issues({ poll: { ...poll, answers: [] } })).not.toEqual([]);
    expect(
      issues({ poll: { ...poll, question: { text: "a".repeat(301) } } }),
    ).not.toEqual([]);
    expect(
      issues({
        poll: { ...poll, answers: [{ poll_media: { text: "a".repeat(56) } }] },
      }),
    ).not.toEqual([]);
    expect(issues({ poll: { ...poll, duration: 0 } })).not.toEqual([]);
    expect(issues({ poll: { ...poll, duration: 769 } })).not.toEqual([]);
    expect(issues({ poll: { ...poll, duration: 768 } })).toEqual([]);
  });

  test("components v2 messages can't have one", () => {
    const paths = issues({
      flags: COMPONENTS_V2_FLAG,
      components: [{ type: 10, content: "hi" }],
      poll,
    }).map((i) => i.path.join("."));

    expect(paths).toEqual(["poll"]);
  });

  test("a response message has no poll", () => {
    const res = responseMessageSchema.safeParse({ content: "hi", poll });

    expect(res.success && "poll" in res.data).toBe(false);
  });

  test("importing fills in what Discord leaves out", () => {
    const message = parseMessageWithAction({
      poll: {
        question: { text: "Pizza or pasta?", emoji: null },
        answers: [{ poll_media: { text: "Pizza", emoji: null } }, {}],
        duration: null,
        allow_multiselect: null,
      },
    });

    expect(message.poll).toEqual({
      question: { text: "Pizza or pasta?" },
      answers: [
        { poll_media: { text: "Pizza" } },
        { poll_media: { text: "" } },
      ],
      duration: 24,
      allow_multiselect: false,
    });
  });

  test("importing keeps a poll as it is", () => {
    expect(parseMessageWithAction({ poll }).poll).toEqual(poll);
  });

  test("a message without a poll has none after importing", () => {
    expect(parseMessageWithAction({ content: "hi" }).poll).toBeUndefined();
    expect(
      parseMessageWithAction({ content: "hi", poll: null }).poll,
    ).toBeUndefined();
  });
});

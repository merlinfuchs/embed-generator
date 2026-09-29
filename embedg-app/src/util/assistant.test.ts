import { describe, expect, it } from "vitest";
import type {
  AssistantChatRequestWire,
  AssistantChatResponseDataWire,
} from "../api/wire";
import { parseMessageWithAction } from "../discord/importSchema";
import type { Message } from "../discord/schema";
import {
  composeFieldAnswers,
  runAssistantPrompt,
  serializeMessage,
} from "./assistant";

const baseMessage: Message = {
  content: "Hello",
  tts: false,
  embeds: [],
  components: [],
  actions: {},
  flags: 0,
};

// run runs a prompt against an editor holding the given message, with the
// server answering with the given response, or failing if there is none.
async function run(
  answer: Partial<AssistantChatResponseDataWire> | null,
  message: Message = baseMessage,
) {
  const editor = { message, applied: 0 };
  const requests: AssistantChatRequestWire[] = [];
  const res = await runAssistantPrompt({
    messages: [{ role: "user", content: "Make a welcome message" }],
    // A copy each time, like the editor converts its document.
    getMessage: () => structuredClone(editor.message),
    applyMessage: (message) => {
      editor.message = message;
      editor.applied++;
    },
    send: async (req) => {
      requests.push(req);
      if (!answer) {
        return {
          success: false,
          data: null as never,
          error: {
            status: 400,
            code: "resource_limit",
            message: "You've used all 5 AI prompts for this month.",
          },
        };
      }
      return {
        success: true,
        data: {
          message: "Done.",
          data: "",
          build_prompt: "",
          fields: [],
          issues: [],
          repairs: 0,
          usage: { prompts_used: 1, prompts_limit: 5 },
          ...answer,
        },
      };
    },
  });
  return { ...res, editor, requests };
}

const welcome = JSON.stringify({
  embeds: [{ title: "Welcome", fields: [{ name: "Rules", value: "Be nice" }] }],
});

describe("runAssistantPrompt", () => {
  it("applies the message the assistant answers with", async () => {
    const res = await run({ data: welcome, repairs: 1 });

    expect(res.requests[0].message).toBe(
      '{"content":"Hello","tts":false,"embeds":[],"components":[],"actions":{},"flags":0}',
    );
    expect(res).toMatchObject({ message: "Done.", repairs: 1, issues: [] });
    expect(res.editor.applied).toBe(1);
    expect(res.editor.message.embeds[0].title).toBe("Welcome");
    expect(res.editor.message.content).toBe("");
  });

  it("doesn't change the message for answers without one", async () => {
    const res = await run({ build_prompt: "Add a title" });

    expect(res).toMatchObject({ buildPrompt: "Add a title" });
    expect(res.editor.applied).toBe(0);
  });

  it("lists the problems the message has for the user", async () => {
    const res = await run({
      data: JSON.stringify({ embeds: [{ title: "x".repeat(300) }] }),
      issues: ["Action 1 uses role 9, which the server doesn't have."],
    });

    expect(res.editor.applied).toBe(1);
    expect(res.issues).toEqual([
      "Action 1 uses role 9, which the server doesn't have.",
      "embeds.0.title: String must contain at most 256 character(s)",
    ]);
  });

  it("doesn't list problems the message had before", async () => {
    const res = await run(
      { data: JSON.stringify({ content: "x".repeat(2001) }) },
      { ...baseMessage, content: "x".repeat(2001) },
    );

    expect(res.issues).toEqual([]);
  });

  it("throws when the prompt fails", async () => {
    await expect(run(null)).rejects.toThrow("You've used all 5");
  });
});

describe("serializeMessage", () => {
  it("leaves out the editor's ids and reads back the same", () => {
    const message: Message = {
      ...baseMessage,
      embeds: [{ id: 5, title: "Hi", fields: [] }],
      allowed_mentions: {
        parse: [],
        roles: [],
        users: [],
        replied_user: false,
      },
      components: [
        {
          id: 6,
          type: 1,
          components: [
            {
              id: 7,
              type: 2,
              style: 3,
              label: "Go",
              action_set_id: "123",
              emoji: { id: "99", name: "party", animated: false },
            },
          ],
        },
      ],
      actions: { "123": { actions: [] } },
    };

    const serialized = serializeMessage(message);
    expect(serialized).not.toMatch(/"id":\d/);
    expect(serialized).toContain('"id":"99"');

    const withoutIds = (m: Message) =>
      JSON.stringify(m, (key, value) =>
        key === "id" && typeof value === "number" ? undefined : value,
      );
    expect(
      JSON.parse(withoutIds(parseMessageWithAction(JSON.parse(serialized)))),
    ).toEqual(JSON.parse(withoutIds(message)));
  });
});

describe("composeFieldAnswers", () => {
  it("leaves out empty answers", () => {
    const field = {
      description: "",
      type: "text",
      options: [],
      default: "",
    };

    expect(
      composeFieldAnswers(
        [
          { ...field, label: "Channel" },
          { ...field, label: "Color" },
        ],
        ["#rules (channel ID 1)", " "],
      ),
    ).toBe("- Channel: #rules (channel ID 1)");
  });
});

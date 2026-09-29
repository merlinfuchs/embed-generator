import { describe, expect, it } from "vitest";
import type {
  AssistantChatRequestWire,
  AssistantChatResponseDataWire,
} from "../api/wire";
import { parseMessageWithAction } from "../discord/importSchema";
import type { Message } from "../discord/schema";
import {
  composeFieldAnswers,
  findIssues,
  runAssistantPrompt,
  serializeMessage,
} from "./assistant";

const usage = { prompts_used: 1, prompts_limit: 5 };

const features = {
  components_v2: true,
  component_types: [1, 2, 3, 9, 10, 11, 12, 14, 17],
  max_actions_per_component: 2,
};

const baseMessage: Message = {
  content: "Hello",
  tts: false,
  embeds: [],
  components: [],
  actions: {},
  flags: 0,
};

type Round =
  | Partial<AssistantChatResponseDataWire>
  | ((req: AssistantChatRequestWire) => Partial<AssistantChatResponseDataWire>);

// fakeAPI answers each request with the next of the given rounds, or fails
// with the given error if there are none left, and records the requests.
function fakeAPI(
  rounds: Round[],
  error = { status: 400, code: "repair_limit", message: "Too many repairs" },
) {
  const requests: AssistantChatRequestWire[] = [];
  const send = async (req: AssistantChatRequestWire) => {
    requests.push(req);
    const round = rounds[requests.length - 1];
    if (!round) return { success: false as const, data: null as never, error };
    return {
      success: true as const,
      data: {
        prompt_id: "p1",
        message: requests.length === 1 ? "Done." : "",
        data: "",
        build_prompt: "",
        fields: [],
        issues: [],
        usage,
        ...(typeof round === "function" ? round(req) : round),
      },
    };
  };
  return { requests, send };
}

// run runs a prompt against an editor holding the given message.
async function run(
  api: ReturnType<typeof fakeAPI>,
  message: Message = baseMessage,
  onApply?: (editor: { message: Message }) => void,
) {
  const editor = { message, applied: 0 };
  const res = await runAssistantPrompt({
    messages: [{ role: "user", content: "Make a welcome message" }],
    features,
    // A copy each time, like the editor converts its document.
    getMessage: () => structuredClone(editor.message),
    applyMessage: (message) => {
      editor.message = message;
      editor.applied++;
      onApply?.(editor);
    },
    send: api.send,
  });
  return { ...res, editor };
}

const welcome = JSON.stringify({
  embeds: [{ title: "Welcome", fields: [{ name: "Rules", value: "Be nice" }] }],
});

const emptyField = JSON.stringify({
  embeds: [{ title: "Welcome", fields: [{ name: "Rules", value: "" }] }],
});

describe("runAssistantPrompt", () => {
  it("applies the message the assistant answers with", async () => {
    const api = fakeAPI([{ data: welcome }]);

    const res = await run(api);

    expect(api.requests).toHaveLength(1);
    expect(api.requests[0].message).toBe(
      '{"content":"Hello","tts":false,"embeds":[],"components":[],"actions":{},"flags":0}',
    );
    expect(res).toMatchObject({ message: "Done.", issues: [] });
    expect(res.editor.applied).toBe(1);
    expect(res.editor.message.embeds[0].title).toBe("Welcome");
    expect(res.editor.message.content).toBe("");
  });

  it("doesn't change the message for answers without one", async () => {
    const api = fakeAPI([{ build_prompt: "Add a title" }]);

    const res = await run(api);

    expect(res).toMatchObject({ buildPrompt: "Add a title" });
    expect(res.editor.applied).toBe(0);
  });

  it("sends the problems with the message back to be fixed", async () => {
    const api = fakeAPI([{ data: emptyField }, { data: welcome }]);

    const res = await run(api);

    expect(api.requests).toHaveLength(2);
    expect(api.requests[1].repair_prompt_id).toBe("p1");
    expect(api.requests[1].issues).toEqual([
      "embeds.0.fields.0.value: String must contain at least 1 character(s)",
    ]);
    // Sent as applied, with the problem in it.
    expect(api.requests[1].message).toContain('"value":""');
    expect(api.requests[1].messages.at(-1)).toEqual({
      role: "assistant",
      content: "Done.",
    });
    expect(res).toMatchObject({ message: "Done.", repairs: 1, issues: [] });
    expect(res.editor.message.embeds[0].fields[0].value).toBe("Be nice");
  });

  it("sends back what the server found too", async () => {
    const api = fakeAPI([
      { data: welcome, issues: ["Action 1 uses role 9, which is unknown."] },
      { data: welcome },
    ]);

    const res = await run(api);

    expect(api.requests[1].issues).toEqual([
      "Action 1 uses role 9, which is unknown.",
    ]);
    expect(res.issues).toEqual([]);
  });

  it("sends back a message that isn't JSON without applying it", async () => {
    const api = fakeAPI([{ data: '{"embeds": [' }, { data: welcome }]);

    const res = await run(api);

    expect(api.requests[1].issues).toEqual(["new_message isn't valid JSON."]);
    expect(res.editor.applied).toBe(1);
    expect(res.issues).toEqual([]);
  });

  it("doesn't send problems the message had before", async () => {
    const api = fakeAPI([{ data: welcome }]);
    const broken = { ...baseMessage, content: "x".repeat(2001) };

    const res = await run(api, broken);

    expect(api.requests).toHaveLength(1);
    expect(res.issues).toEqual([]);
  });

  it("stops quietly when no more repairs are allowed", async () => {
    const api = fakeAPI([{ data: emptyField }]);

    const res = await run(api);

    expect(api.requests).toHaveLength(2);
    expect(res.issues).toEqual([
      "embeds.0.fields.0.value: String must contain at least 1 character(s)",
    ]);
  });

  it("reports why a repair failed", async () => {
    const api = fakeAPI([{ data: emptyField }], {
      status: 503,
      code: "assistant_unavailable",
      message: "Unavailable",
    });

    const res = await run(api);

    expect(res.issues.at(-1)).toBe("Unavailable");
  });

  it("keeps problems a repair without a message didn't fix", async () => {
    const api = fakeAPI([{ data: emptyField }, {}]);

    const res = await run(api);

    expect(api.requests).toHaveLength(3);
    expect(res.repairs).toBe(1);
    expect(res.issues).toHaveLength(1);
  });

  it("stops repairing when the user changes the message", async () => {
    let editor: { message: Message } | undefined;
    const api = fakeAPI([
      { data: emptyField },
      () => {
        // The user edits while the repair is on its way.
        if (editor) editor.message = { ...editor.message, content: "Mine" };
        return { data: emptyField };
      },
    ]);

    const res = await run(api, baseMessage, (e) => {
      editor ??= e;
    });

    expect(api.requests).toHaveLength(2);
    expect(res.editor.applied).toBe(1);
    expect(res.editor.message.content).toBe("Mine");
    expect(res.issues).toEqual([]);
  });

  it("throws when the prompt fails", async () => {
    const api = fakeAPI([], {
      status: 400,
      code: "resource_limit",
      message: "You've used all 5 AI prompts for this month.",
    });

    await expect(run(api)).rejects.toThrow("You've used all 5");
  });
});

describe("findIssues", () => {
  const button = (actionSetId: string) => ({
    id: 1,
    type: 2 as const,
    style: 1 as const,
    label: "Click",
    action_set_id: actionSetId,
  });

  it("reports what the plan doesn't include", () => {
    const message: Message = {
      ...baseMessage,
      content: "",
      flags: 1 << 15,
      components: [
        {
          id: 1,
          type: 13,
          file: { url: "attachment://a.png" },
        },
        {
          id: 2,
          type: 1,
          components: [button("a"), button("a")],
        },
      ],
      actions: {
        a: {
          actions: [1, 2, 3].map((i) => ({
            id: i,
            type: 1 as const,
            text: "Hi",
            public: false,
            allow_role_mentions: false,
          })),
        },
      },
    };

    expect(findIssues(message, features)).toEqual([
      "components.0: The plan doesn't include components of type 13.",
      'components.1.components.1: action_set_id "a" is also used by components.1.components.0. Give this one its own action_set_id and action set.',
      "actions.a: The plan allows 2 actions per button or option, not 3.",
    ]);
    expect(findIssues(message, { ...features, components_v2: false })[0]).toBe(
      "flags: The plan doesn't include components v2.",
    );
  });

  it("checks buttons in sections", () => {
    const message: Message = {
      ...baseMessage,
      content: "",
      flags: 1 << 15,
      components: [
        {
          id: 1,
          type: 9,
          components: [{ id: 2, type: 10, content: "Hi" }],
          accessory: button("a"),
        },
      ],
    };

    expect(
      findIssues(message, { ...features, component_types: [9, 10] }),
    ).toEqual([
      "components.0.accessory: The plan doesn't include components of type 2.",
    ]);
  });
});

describe("findIssues sections", () => {
  it("explains sections without an accessory", () => {
    const message: Message = {
      ...baseMessage,
      content: "",
      flags: 1 << 15,
      components: [
        {
          id: 1,
          type: 9,
          components: [{ id: 2, type: 10, content: "Hi" }],
          accessory: { id: 3, type: 11, media: { url: "" } },
        },
      ],
    };

    expect(findIssues(message, null)).toEqual([
      "components.0: A section needs an accessory, a button or a thumbnail with an image URL. Use text displays without a section instead.",
    ]);
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

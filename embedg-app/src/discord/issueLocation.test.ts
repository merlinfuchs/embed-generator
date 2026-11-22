import { expect, test } from "vitest";
import { describeIssueLocation } from "./issueLocation";
import { messageSchema } from "./schema";

const message = {
  content: "",
  flags: 32768,
  embeds: [],
  components: [
    {
      id: 1,
      type: 17,
      components: [
        { id: 2, type: 10, content: "## Forms" },
        {
          id: 3,
          type: 1,
          components: [
            {
              id: 4,
              type: 2,
              style: 5,
              label: "Forms",
              url: "https://message.style/features/forms",
              action_set_id: "1",
            },
            {
              id: 5,
              type: 2,
              style: 1,
              label: "Test Forms",
              action_set_id: "2",
            },
          ],
        },
      ],
    },
    {
      id: 6,
      type: 1,
      components: [
        {
          id: 7,
          type: 3,
          options: [{ id: 8, label: "Apply", action_set_id: "3" }],
        },
      ],
    },
  ],
  actions: {
    "2": { actions: [{ type: 13, id: 9, target_id: "" }] },
    "3": { actions: [{ type: 1, id: 10, text: "" }] },
  },
};

test("names the button whose action has no form", () => {
  const res = messageSchema.safeParse(message);
  expect(res.success).toBe(false);
  if (res.success) return;

  expect(describeIssueLocation(message, res.error.issues[0].path)).toBe(
    'Container 1 › Action Row 2 › Button "Test Forms" › Actions › Show Form',
  );
});

test("names the select menu option that runs an action set", () => {
  expect(
    describeIssueLocation(message, ["actions", "3", "actions", 0, "text"]),
  ).toBe(
    'Action Row 2 › Select Menu 1 › Option 1 "Apply" › Actions › Text Response',
  );
});

test("names components, embeds and message fields", () => {
  expect(
    describeIssueLocation(message, [
      "components",
      0,
      "components",
      0,
      "content",
    ]),
  ).toBe("Container 1 › Text Display 1");
  expect(
    describeIssueLocation(message, ["embeds", 1, "fields", 2, "name"]),
  ).toBe("Embed 2 › Field 3");
  expect(describeIssueLocation(message, ["embeds", 0, "title"])).toBe(
    "Embed 1 › Body",
  );
  expect(describeIssueLocation(message, ["content"])).toBe("Content");
  expect(describeIssueLocation(message, ["components"])).toBe("Components");
});

test("gives up on paths it has no name for", () => {
  expect(describeIssueLocation(message, [])).toBeNull();
  expect(describeIssueLocation(message, ["flags"])).toBeNull();
  expect(
    describeIssueLocation(message, ["actions", "missing", "actions", 0]),
  ).toBeNull();
});

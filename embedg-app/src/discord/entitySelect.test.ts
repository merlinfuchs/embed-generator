import { describe, expect, test } from "vitest";
import { createDocumentStore } from "../state/document";
import { fromMessage, toMessage } from "../state/documentConvert";
import { parseMessageWithAction } from "./importSchema";
import { describeIssueLocation } from "./issueLocation";
import { messageSchema } from "./schema";

function selectMessage(select: object) {
  return {
    components: [{ type: 1, components: [select] }],
    actions: {},
  };
}

describe.each([5, 6, 7, 8])("select menu of type %i", (type) => {
  const select = {
    type,
    placeholder: "Pick",
    min_values: 0,
    max_values: 3,
    action_set_id: "set",
  };

  test("survives the editor", () => {
    const message = messageSchema.parse(selectMessage(select));
    const result = toMessage(fromMessage(message)).message;

    expect(result.components[0]).toMatchObject({ components: [select] });
  });

  test("is imported without being turned into another component", () => {
    // Discord sends nulls and leaves max_values at 0 for the default.
    const message = parseMessageWithAction(
      selectMessage({ type, placeholder: null, max_values: 0 }),
    );

    expect(message.components[0]).toMatchObject({ components: [{ type }] });
    expect(messageSchema.safeParse(message).success).toBe(true);
  });
});

test("more min than max choices is invalid", () => {
  const result = messageSchema.safeParse(
    selectMessage({ type: 5, min_values: 2 }),
  );

  expect(result.success).toBe(false);
});

test("an added select gets an action set, which goes with it", () => {
  const store = createDocumentStore(null);
  const { insert, rootId } = store.getState();
  const rowId = insert(rootId, "components", "end", { type: "actionRow" });
  const id = insert(rowId, "components", "end", {
    type: "entitySelect",
    selectType: 6,
  });

  const node = store.getState().nodes[id];
  if (node.type !== "entitySelect") throw new Error("not an entity select");
  expect(store.getState().actions[node.action_set_id]).toEqual({ actions: [] });

  store.getState().remove(id);
  expect(store.getState().actions[node.action_set_id]).toBeUndefined();
});

test("a problem with its actions names the select", () => {
  const message = selectMessage({ type: 7, action_set_id: "set" });

  expect(
    describeIssueLocation(message, ["actions", "set", "actions", 0]),
  ).toContain("User & Role Select 1");
});

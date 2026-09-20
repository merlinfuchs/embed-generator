import { expect, test } from "vitest";
import { ZodError, type ZodIssue } from "zod";
import { useValidationErrorStore } from "./validationError";

function issue(path: (string | number)[], message: string): ZodIssue {
  return { code: "custom", path, message } as ZodIssue;
}

const error = new ZodError([
  issue(["embeds", 0, "title"], "Too long"),
  issue(["embeds", 0, "author", "name"], "Required"),
  issue(["content"], "Content is required"),
]);

const idToPath = new Map([
  ["root", ""],
  ["embed-a", "embeds.0"],
  ["embed-b", "embeds.1"],
]);

function setError() {
  useValidationErrorStore.getState().setError(error, idToPath);
  return useValidationErrorStore.getState();
}

test("an issue is found by node and field", () => {
  const state = setError();

  expect(state.getIssue({ nodeId: "embed-a", field: "title" })?.message).toBe(
    "Too long",
  );
  expect(
    state.getIssue({ nodeId: "embed-a", field: "author.name" })?.message,
  ).toBe("Required");
  expect(state.getIssue({ nodeId: "embed-b", field: "title" })).toBeNull();
});

test("the root node addresses top level fields", () => {
  const state = setError();

  expect(state.getIssue({ nodeId: "root", field: "content" })?.message).toBe(
    "Content is required",
  );
});

test("a node reports issues nested below it", () => {
  const state = setError();

  expect(state.hasIssue({ nodeId: "embed-a" })).toBe(true);
  expect(state.hasIssue({ nodeId: "embed-a", fields: ["author"] })).toBe(true);
  expect(state.hasIssue({ nodeId: "embed-a", fields: ["footer"] })).toBe(false);
  expect(state.hasIssue({ nodeId: "embed-b" })).toBe(false);
});

test("an unknown node matches nothing", () => {
  const state = setError();

  // A path of "" used to prefix match every issue in the message.
  expect(state.hasIssue({ nodeId: "gone" })).toBe(false);
  expect(state.getIssue({ nodeId: "gone", field: "title" })).toBeNull();
});

test("paths still work for the components on the old store", () => {
  const state = setError();

  expect(state.getIssue("embeds.0.title")?.message).toBe("Too long");
  expect(state.hasIssue("embeds")).toBe(true);
  expect(state.hasIssue(["components", "attachments"])).toBe(false);
});

test("hasAnyIssue answers the send menus", () => {
  expect(setError().hasAnyIssue()).toBe(true);

  useValidationErrorStore.getState().setError(null, idToPath);
  expect(useValidationErrorStore.getState().hasAnyIssue()).toBe(false);
});

test("clearing the error empties the index", () => {
  setError();
  useValidationErrorStore.getState().setError(null, idToPath);

  const state = useValidationErrorStore.getState();
  expect(state.getIssue("embeds.0.title")).toBeNull();
  expect(state.hasIssue({ nodeId: "embed-a" })).toBe(false);
});

test("a message that stays valid does not republish the index", () => {
  useValidationErrorStore.getState().setError(null, idToPath);
  const before = useValidationErrorStore.getState().index;

  useValidationErrorStore.getState().setError(null, idToPath);

  expect(useValidationErrorStore.getState().index).toBe(before);
});

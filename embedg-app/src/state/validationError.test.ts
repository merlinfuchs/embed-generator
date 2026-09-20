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

  expect(state.getIssueForNode("embed-a", "title")?.message).toBe("Too long");
  expect(state.getIssueForNode("embed-a", "author.name")?.message).toBe(
    "Required",
  );
  expect(state.getIssueForNode("embed-b", "title")).toBeNull();
});

test("the root node addresses top level fields", () => {
  const state = setError();

  expect(state.getIssueForNode("root", "content")?.message).toBe(
    "Content is required",
  );
});

test("a node reports issues nested below it", () => {
  const state = setError();

  expect(state.hasIssueForNode("embed-a")).toBe(true);
  expect(state.hasIssueForNode("embed-a", "author")).toBe(true);
  expect(state.hasIssueForNode("embed-a", "footer")).toBe(false);
  expect(state.hasIssueForNode("embed-b")).toBe(false);
});

test("an unknown node matches nothing", () => {
  const state = setError();

  // A path of "" used to prefix match every issue in the message.
  expect(state.hasIssueForNode("gone")).toBe(false);
  expect(state.getIssueForNode("gone", "title")).toBeNull();
});

test("path lookups still work for components on the old store", () => {
  const state = setError();

  expect(state.getIssueByPath("embeds.0.title")?.message).toBe("Too long");
  expect(state.checkIssueByPathPrefix("embeds")).toBe(true);
  expect(state.checkIssueByPathPrefix("components")).toBe(false);
});

test("clearing the error empties the index", () => {
  setError();
  useValidationErrorStore.getState().setError(null, idToPath);

  const state = useValidationErrorStore.getState();
  expect(state.getIssueByPath("embeds.0.title")).toBeNull();
  expect(state.hasIssueForNode("embed-a")).toBe(false);
});

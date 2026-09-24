import { expect, test } from "vitest";
import type { EmbedNode } from "./document";
import { nodeField, slotScope } from "./validationError";

/**
 * The payoff of the typed field paths is that a name the validator never
 * produces does not compile. `tsc` is what enforces this; the assertions below
 * only keep the file from looking empty at runtime.
 */
test("field paths follow the payload, not the node's bookkeeping", () => {
  expect(nodeField<EmbedNode>("embed-1", "title")).toEqual({
    nodeId: "embed-1",
    field: "title",
  });
  expect(nodeField<EmbedNode>("embed-1", "author.name")).toEqual({
    nodeId: "embed-1",
    field: "author.name",
  });

  // Children live under the payload's name and are addressed by slot.
  expect(slotScope("embed-1", "fields")).toEqual({
    nodeId: "embed-1",
    fields: ["fields"],
  });

  // @ts-expect-error the node stores fieldIds, no issue ever sits there
  nodeField<EmbedNode>("embed-1", "fieldIds");
  // @ts-expect-error the node has no such field
  nodeField<EmbedNode>("embed-1", "fields");
  // @ts-expect-error typos should not reach a silent lookup
  nodeField<EmbedNode>("embed-1", "titel");
});

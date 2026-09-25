import { act, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import {
  type EmbedNode,
  type MessageNode,
  messageDocumentStore,
} from "../state/document";
import { loadMessage, renderEditor, rootId } from "../test/editor";
import EditorEmbeds from "./EditorEmbeds";

test("the embeds count their text against Discord's limit", () => {
  loadMessage({
    content: "",
    embeds: [
      { title: "ab", fields: [{ name: "c", value: "de" }] },
      { description: "fgh" },
    ],
  });
  renderEditor(<EditorEmbeds />);

  expect(screen.getByText("8 / 6000 characters")).toHaveClass("text-mist-400");

  const { nodes, update } = messageDocumentStore.getState();
  const [embedId] = (nodes[rootId()] as MessageNode).embedIds;
  act(() => update<EmbedNode>(embedId, { title: "ab!" }));

  expect(screen.getByText("9 / 6000 characters")).toBeInTheDocument();
});

test("the count turns red over the limit", () => {
  loadMessage({
    content: "",
    embeds: [
      { description: "x".repeat(4000) },
      { description: "y".repeat(2001) },
    ],
  });
  renderEditor(<EditorEmbeds />);

  expect(screen.getByText("6001 / 6000 characters")).toHaveClass("text-red");
});

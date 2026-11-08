import { screen } from "@testing-library/react";
import { beforeEach, expect, test } from "vitest";
import { parseMessageWithAction } from "../discord/importSchema";
import { useCurrentAttachmentsStore } from "../state/attachments";
import { renderEditor } from "../test/editor";
import MessagePreview from "./MessagePreview";

const PNG = "data:image/png;base64,iVBORw0KGgo=";

beforeEach(() => {
  useCurrentAttachmentsStore.getState().replaceAttachments([
    { id: 1, name: "pic.png", description: null, data_url: PNG, size: 10 },
    {
      id: 2,
      name: "notes.txt",
      description: null,
      data_url: "data:text/plain;base64,aGk=",
      size: 2048,
    },
  ]);
});

function preview(raw: unknown, showAttachments = true) {
  const msg = parseMessageWithAction(raw);
  return renderEditor(
    <MessagePreview msg={msg} showAttachments={showAttachments} />,
  );
}

test("an embed image that is an attachment shows the file", () => {
  const { container } = preview({
    content: "",
    embeds: [{ description: "x", image: { url: "attachment://pic.png" } }],
  });

  expect(container.querySelector(".discord-embed-image")).toHaveAttribute(
    "src",
    PNG,
  );
});

test("an attachment that doesn't exist shows nothing", () => {
  const { container } = preview({
    content: "",
    embeds: [{ description: "x", image: { url: "attachment://nope.png" } }],
  });

  expect(container.querySelector(".discord-embed-image")).toBeNull();
});

test("attachments no embed uses are listed below a message", () => {
  const { container } = preview({ content: "hi" });

  expect(container.querySelector(".discord-attachment-image")).toHaveAttribute(
    "src",
    PNG,
  );
  expect(screen.getByText("notes.txt")).toBeVisible();
  expect(screen.getByText("2 KB")).toBeVisible();
});

test("an attachment an embed uses isn't listed again", () => {
  const { container } = preview({
    content: "hi",
    embeds: [{ description: "x", image: { url: "attachment://pic.png" } }],
  });

  expect(container.querySelector(".discord-attachment-image")).toBeNull();
  expect(screen.getByText("notes.txt")).toBeVisible();
});

test("attachments stay out of a message that isn't the one being edited", () => {
  preview({ content: "hi" }, false);

  expect(screen.queryByText("notes.txt")).toBeNull();
});

test("a Components V2 message only shows the attachments its components use", () => {
  const { container } = preview({
    content: "",
    flags: 1 << 15,
    components: [
      { type: 13, file: { url: "attachment://notes.txt" } },
      { type: 12, items: [{ media: { url: "attachment://pic.png" } }] },
    ],
  });

  expect(screen.getAllByText("notes.txt")).toHaveLength(1);
  expect(
    container.querySelector(".discord-component-gallery-item"),
  ).toHaveAttribute("src", PNG);
  expect(container.querySelector(".discord-attachment-image")).toBeNull();
});

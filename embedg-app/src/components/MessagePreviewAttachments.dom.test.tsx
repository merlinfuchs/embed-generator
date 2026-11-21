import { screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { parseMessageWithAction } from "../discord/importSchema";
import {
  type MessageAttachment,
  PreviewAttachmentsContext,
} from "../state/attachments";
import { renderEditor } from "../test/editor";
import MessagePreview from "./MessagePreview";

const PNG = "data:image/png;base64,iVBORw0KGgo=";

const ATTACHMENTS: MessageAttachment[] = [
  { id: 1, name: "pic.png", description: null, data_url: PNG, size: 10 },
  {
    id: 2,
    name: "notes.txt",
    description: null,
    data_url: "data:text/plain;base64,aGk=",
    size: 2048,
  },
];

function preview(raw: unknown, withAttachments = true) {
  const msg = parseMessageWithAction(raw);
  return renderEditor(
    <PreviewAttachmentsContext.Provider
      value={withAttachments ? ATTACHMENTS : []}
    >
      <MessagePreview msg={msg} />
    </PreviewAttachmentsContext.Provider>,
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
  const { container } = preview(
    {
      content: "hi",
      embeds: [{ description: "x", image: { url: "attachment://pic.png" } }],
    },
    false,
  );

  expect(screen.queryByText("notes.txt")).toBeNull();
  expect(container.querySelector(".discord-embed-image")).toBeNull();
});

test("attachments are shown above the embeds", () => {
  const { container } = preview({
    content: "hi",
    embeds: [{ description: "x" }],
  });

  const file = screen.getByText("notes.txt");
  const embed = container.querySelector(".discord-embed")!;
  expect(
    file.compareDocumentPosition(embed) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
});

test("an SVG attachment is shown as a file", () => {
  const { container } = renderEditor(
    <PreviewAttachmentsContext.Provider
      value={[
        {
          id: 3,
          name: "logo.svg",
          description: null,
          data_url: "data:image/svg+xml;base64,PHN2Zy8+",
          size: 5,
        },
      ]}
    >
      <MessagePreview msg={parseMessageWithAction({ content: "hi" })} />
    </PreviewAttachmentsContext.Provider>,
  );

  expect(container.querySelector(".discord-attachment-image")).toBeNull();
  expect(screen.getByText("logo.svg")).toBeVisible();
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

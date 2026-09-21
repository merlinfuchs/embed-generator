import { screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { parseMessageWithAction } from "../discord/importSchema";
import { COMPONENTS_V2_FLAG } from "../state/document";
import { editorUser, renderEditor } from "../test/editor";
import MessagePreview from "./MessagePreview";

function renderPreview(raw: unknown) {
  return renderEditor(<MessagePreview msg={parseMessageWithAction(raw)} />);
}

const patchNotes = {
  type: 17,
  accent_color: 1752220,
  components: [
    { type: 10, content: "# Patch Notes" },
    {
      type: 9,
      components: [{ type: 10, content: "The dungeon is tougher." }],
      accessory: {
        type: 2,
        style: 5,
        url: "https://message.style",
        label: "Open",
      },
    },
    {
      type: 12,
      items: [{ media: { url: "https://message.style/one.png" } }],
    },
    { type: 14, spacing: 1, divider: true },
    {
      type: 1,
      components: [
        { type: 2, style: 5, url: "https://message.style", label: "Store" },
      ],
    },
  ],
};

test("a components v2 message renders its components", () => {
  const { container } = renderPreview({
    content: "",
    flags: COMPONENTS_V2_FLAG,
    embeds: [],
    components: [patchNotes],
  });

  expect(screen.getByRole("heading", { name: "Patch Notes" })).toBeVisible();
  expect(screen.getByText("The dungeon is tougher.")).toBeVisible();
  expect(screen.getByRole("link", { name: "Open" })).toHaveAttribute(
    "href",
    "https://message.style",
  );
  expect(screen.getByRole("link", { name: "Store" })).toBeVisible();
  expect(
    container.querySelector(".discord-component-gallery-item"),
  ).toHaveAttribute("src", "https://message.style/one.png");
});

test("content and embeds are left out of a components v2 message", () => {
  renderPreview({
    content: "some content",
    flags: COMPONENTS_V2_FLAG,
    embeds: [{ title: "some embed", fields: [] }],
    components: [patchNotes],
  });

  expect(screen.queryByText("some content")).not.toBeInTheDocument();
  expect(screen.queryByText("some embed")).not.toBeInTheDocument();
});

test("a message without the flag still renders content and embeds", () => {
  renderPreview({
    content: "some content",
    embeds: [{ title: "some embed", fields: [] }],
    components: [],
  });

  expect(screen.getByText("some content")).toBeVisible();
  expect(screen.getByText("some embed")).toBeVisible();
});

test("a spoiler hides its content until it is clicked", async () => {
  renderPreview({
    content: "",
    flags: COMPONENTS_V2_FLAG,
    embeds: [],
    components: [
      {
        type: 17,
        components: [
          {
            type: 12,
            items: [
              {
                media: { url: "https://message.style/one.png" },
                spoiler: true,
              },
            ],
          },
        ],
      },
    ],
  });

  const spoiler = screen.getByRole("button", { name: "Reveal spoiler" });
  expect(spoiler).toBeVisible();

  await editorUser().click(spoiler);

  expect(
    screen.queryByRole("button", { name: "Reveal spoiler" }),
  ).not.toBeInTheDocument();
});

// The editor drops the accessory while one is being picked, and the document
// converter passes that straight through so validation can report it.
test("a section without an accessory still renders", () => {
  const msg = parseMessageWithAction({
    content: "",
    flags: COMPONENTS_V2_FLAG,
    embeds: [],
    components: [
      {
        type: 17,
        components: [
          {
            type: 9,
            components: [{ type: 10, content: "No accessory yet" }],
            accessory: {
              type: 11,
              media: { url: "https://message.style/a.png" },
            },
          },
        ],
      },
    ],
  });

  const container = msg.components[0] as {
    components: { accessory?: unknown }[];
  };
  delete container.components[0].accessory;

  renderEditor(<MessagePreview msg={msg} />);

  expect(screen.getByText("No accessory yet")).toBeVisible();
});

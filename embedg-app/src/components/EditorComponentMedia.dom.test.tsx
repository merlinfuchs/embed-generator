import { screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { COMPONENTS_V2_FLAG } from "../state/document";
import { useCurrentAttachmentsStore } from "../state/attachments";
import {
  currentComponents,
  editorUser,
  loadMessage,
  renderEditor,
} from "../test/editor";
import EditorComponents from "./EditorComponents";

vi.mock("../util/premium", () => ({
  usePremiumGuildFeatures: () => ({
    component_types: [1, 2, 3, 9, 10, 11, 12, 13, 14, 17],
    max_actions_per_component: 5,
  }),
  usePremiumUserFeatures: () => ({}),
}));

function galleryMessage(items: { url: string }[]) {
  return {
    content: "",
    flags: COMPONENTS_V2_FLAG,
    components: [{ type: 12, items: items.map((media) => ({ media })) }],
  };
}

function firstComponent() {
  return currentComponents()[0] as {
    type: number;
    items?: { media: { url: string }; spoiler?: boolean }[];
    file?: { url: string };
    spoiler?: boolean;
  };
}

beforeEach(() => {
  useCurrentAttachmentsStore.getState().clearAttachments();
});

test("adding a gallery item puts an empty item in the message", async () => {
  loadMessage(galleryMessage([{ url: "https://message.style/a.png" }]));
  renderEditor(<EditorComponents defaultCollapsed={false} />);

  await editorUser().click(screen.getByRole("button", { name: "Add Item" }));

  expect(firstComponent().items).toMatchObject([
    { media: { url: "https://message.style/a.png" } },
    { media: { url: "" } },
  ]);
});

test("typing a gallery item url reaches the message", async () => {
  loadMessage(galleryMessage([{ url: "" }]));
  renderEditor(<EditorComponents defaultCollapsed={false} />);

  await editorUser().type(
    screen.getByLabelText("File URL"),
    "https://message.style/b.png",
  );

  expect(firstComponent().items?.[0].media.url).toBe(
    "https://message.style/b.png",
  );
});

test("marking a gallery item as a spoiler reaches the message", async () => {
  loadMessage(galleryMessage([{ url: "https://message.style/a.png" }]));
  renderEditor(<EditorComponents defaultCollapsed={false} />);

  await editorUser().click(screen.getByRole("checkbox"));

  expect(firstComponent().items?.[0].spoiler).toBe(true);
});

test("the gallery stops adding at ten items", async () => {
  loadMessage(
    galleryMessage(
      Array.from({ length: 10 }, (_, i) => ({
        url: `https://message.style/${i}.png`,
      })),
    ),
  );
  renderEditor(<EditorComponents defaultCollapsed={false} />);

  expect(screen.getByRole("button", { name: "Add Item" })).toBeDisabled();
});

test("clearing the gallery empties it", async () => {
  loadMessage(galleryMessage([{ url: "https://message.style/a.png" }]));
  renderEditor(<EditorComponents defaultCollapsed={false} />);

  await editorUser().click(screen.getByRole("button", { name: "Clear Items" }));

  expect(firstComponent().items).toEqual([]);
});

test("a file component offers the uploaded attachments", async () => {
  useCurrentAttachmentsStore.getState().replaceAttachments([
    { id: 1, name: "notes.txt", description: "", data_url: "data:,", size: 1 },
    { id: 2, name: "game.zip", description: "", data_url: "data:,", size: 2 },
  ]);
  loadMessage({
    content: "",
    flags: COMPONENTS_V2_FLAG,
    components: [{ type: 13, file: { url: "" } }],
  });
  renderEditor(<EditorComponents defaultCollapsed={false} />);

  await editorUser().selectOptions(
    screen.getByRole("combobox", { name: "Attachment" }),
    "attachment://game.zip",
  );

  expect(firstComponent().file?.url).toBe("attachment://game.zip");
});

test("marking a file as a spoiler reaches the message", async () => {
  loadMessage({
    content: "",
    flags: COMPONENTS_V2_FLAG,
    components: [{ type: 13, file: { url: "attachment://a.txt" } }],
  });
  renderEditor(<EditorComponents defaultCollapsed={false} />);

  await editorUser().click(screen.getByRole("checkbox"));

  expect(firstComponent().spoiler).toBe(true);
});

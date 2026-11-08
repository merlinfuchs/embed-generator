import { fireEvent, screen, waitFor } from "@testing-library/react";
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
    max_actions_per_component: 5,
    max_image_upload_size: 10 * 1024 * 1024,
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

test("a file component can pick one of the uploaded attachments", async () => {
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

  const user = editorUser();
  await user.click(screen.getByRole("button", { name: "Add file" }));
  await user.click(screen.getByRole("button", { name: "game.zip" }));

  expect(firstComponent().file?.url).toBe("attachment://game.zip");
});

test("uploading a file from a file component adds an attachment and fills the url", async () => {
  loadMessage({
    content: "",
    flags: COMPONENTS_V2_FLAG,
    components: [{ type: 13, file: { url: "" } }],
  });
  const { container } = renderEditor(
    <EditorComponents defaultCollapsed={false} />,
  );

  // With nothing to pick from, the + goes straight to choosing a file.
  await editorUser().click(screen.getByRole("button", { name: "Add file" }));
  expect(screen.queryByRole("button", { name: "Upload new file" })).toBeNull();
  fireEvent.change(container.querySelector('input[type="file"]')!, {
    target: { files: [new File(["hi"], "my notes (1).txt")] },
  });

  await waitFor(() =>
    expect(firstComponent().file?.url).toBe("attachment://my_notes_1_.txt"),
  );
  expect(useCurrentAttachmentsStore.getState().attachments).toMatchObject([
    { name: "my_notes_1_.txt", size: 2 },
  ]);
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

test("a gallery item can upload an image to the CDN", () => {
  loadMessage(galleryMessage([{ url: "" }]));
  renderEditor(<EditorComponents defaultCollapsed={false} />);

  expect(screen.getByRole("button", { name: "Upload image" })).toBeVisible();
});

test("a file with no attachment of that name says so", () => {
  loadMessage({
    content: "",
    flags: COMPONENTS_V2_FLAG,
    components: [{ type: 13, file: { url: "attachment://gone.zip" } }],
  });
  renderEditor(<EditorComponents defaultCollapsed={false} />);

  expect(screen.getByText(/no attachment with that name/)).toBeVisible();
});

test("a file with an attachment of that name doesn't", () => {
  useCurrentAttachmentsStore
    .getState()
    .replaceAttachments([
      { id: 1, name: "here.zip", description: "", data_url: "data:,", size: 1 },
    ]);
  loadMessage({
    content: "",
    flags: COMPONENTS_V2_FLAG,
    components: [{ type: 13, file: { url: "attachment://here.zip" } }],
  });
  renderEditor(<EditorComponents defaultCollapsed={false} />);

  expect(screen.queryByText(/no attachment with that name/)).toBeNull();
});

import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, test } from "vitest";
import { useCurrentAttachmentsStore } from "../state/attachments";
import { loadMessage, renderEditor } from "../test/editor";
import { useToasts } from "../util/toasts";
import EditorAttachments from "./EditorAttachments";

const MiB = 1024 * 1024;

beforeEach(() => {
  useCurrentAttachmentsStore.getState().clearAttachments();
  useToasts.setState({ toasts: [] });
  loadMessage({ content: "" });
});

function fileOfSize(name: string, size: number) {
  const file = new File(["x"], name);
  Object.defineProperty(file, "size", { value: size });
  return file;
}

function select(...files: File[]) {
  const { container } = renderEditor(<EditorAttachments />);
  // The input only renders expanded, and whether it is carries over between tests.
  if (!container.querySelector('input[type="file"]')) {
    fireEvent.click(screen.getByText("Attachments"));
  }
  const input = container.querySelector('input[type="file"]')!;
  fireEvent.change(input, { target: { files } });
}

test("a file over Discord's 20 MB is refused", () => {
  select(fileOfSize("big.mp4", 20 * MiB + 1));

  expect(useToasts.getState().toasts).toMatchObject([
    { title: "File too large" },
  ]);
});

test("files that go over the per message limit together are refused", async () => {
  select(fileOfSize("a.mp4", 15 * MiB), fileOfSize("b.mp4", 15 * MiB));

  expect(useToasts.getState().toasts).toMatchObject([
    { title: "Attachments too large" },
  ]);
  await waitFor(() =>
    expect(useCurrentAttachmentsStore.getState().attachments).toHaveLength(1),
  );
});

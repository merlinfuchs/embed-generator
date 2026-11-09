import { expect, test } from "vitest";
import { findAttachment, sanitizeAttachmentName } from "./attachments";

test("an attachment name keeps its extension when nothing else is left", () => {
  expect(sanitizeAttachmentName("my notes (1).txt")).toBe("my_notes_1_.txt");
  expect(sanitizeAttachmentName("日本.png")).toBe("file.png");
  expect(sanitizeAttachmentName(".env")).toBe("env");
});

test("an escaped attachment:// reference finds the file", () => {
  const file = {
    id: 1,
    name: "a b.txt",
    description: null,
    data_url: "",
    size: 1,
  };
  expect(findAttachment([file], "attachment://a%20b.txt")).toBe(file);
  expect(findAttachment([file], "attachment://a b.txt")).toBe(file);
  expect(findAttachment([file], "https://a b.txt")).toBeUndefined();
});

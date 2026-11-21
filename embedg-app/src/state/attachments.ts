import { create } from "zustand";
import type { MessageAttachmentWire } from "../api/wire";
import { immer } from "zustand/middleware/immer";
import { createContext, useContext } from "react";

/** Discord's per message attachment limit. */
export const MAX_ATTACHMENTS = 10;

/** Discord's limit per file, before server boosts raise it. */
export const MAX_FILE_BYTES = 20 * 1024 * 1024;

/**
 * Discord takes at most 25 MiB per message request, which also carries the
 * message itself, so the files leave it some room.
 */
export const MAX_TOTAL_ATTACHMENT_BYTES = 24.5 * 1024 * 1024;

export interface MessageAttachment extends MessageAttachmentWire {
  id: number;
  size: number;
}

export interface AttachmentsStore {
  attachments: MessageAttachment[];
  replaceAttachments: (attachments: MessageAttachment[]) => void;
  addAttachment: (attachment: MessageAttachment) => void;
  clearAttachments: () => void;
  removeAttachment: (i: number) => void;
  setAttachmentName: (i: number, name: string) => void;
  moveAttachmentUp: (i: number) => void;
  moveAttachmentDown: (i: number) => void;
}

export const useCurrentAttachmentsStore = create<AttachmentsStore>()(
  immer((set) => ({
    attachments: [],

    replaceAttachments: (attachments: MessageAttachment[]) =>
      set((state) => {
        state.attachments = attachments;
      }),
    addAttachment: (attachment: MessageAttachment) =>
      set((state) => {
        state.attachments.push(attachment);
      }),
    clearAttachments: () =>
      set((state) => {
        state.attachments = [];
      }),
    removeAttachment: (i: number) =>
      set((state) => {
        state.attachments.splice(i, 1);
      }),
    setAttachmentName: (i: number, name: string) =>
      set((state) => {
        state.attachments[i].name = name;
      }),
    moveAttachmentUp: (i: number) =>
      set((state) => {
        const attachment = state.attachments[i];
        state.attachments.splice(i, 1);
        state.attachments.splice(i - 1, 0, attachment);
      }),
    moveAttachmentDown: (i: number) =>
      set((state) => {
        const attachment = state.attachments[i];
        state.attachments.splice(i, 1);
        state.attachments.splice(i + 1, 0, attachment);
      }),
  })),
);

export const ATTACHMENT_URL_PREFIX = "attachment://";

export function attachmentUrl(name: string): string {
  return `${ATTACHMENT_URL_PREFIX}${name}`;
}

/** The file name an attachment:// URL refers to, as typed and unescaped. */
export function attachmentNames(
  url: string | undefined | null,
): [string, string] | undefined {
  if (!url?.startsWith(ATTACHMENT_URL_PREFIX)) return undefined;

  const ref = url.slice(ATTACHMENT_URL_PREFIX.length);
  try {
    return [ref, decodeURIComponent(ref)];
  } catch {
    // Not escaped, so the name is taken as typed.
    return [ref, ref];
  }
}

/** The attachment an attachment:// URL points to, if the message has it. */
export function findAttachment(
  attachments: MessageAttachment[],
  url: string | undefined | null,
): MessageAttachment | undefined {
  const names = attachmentNames(url);
  if (!names) return undefined;
  return attachments.find((a) => names.includes(a.name));
}

/**
 * The attachments a preview resolves attachment:// URLs against. Only the editor's own preview
 * provides them, as a restored, shared or response message isn't sent with these files.
 */
export const PreviewAttachmentsContext = createContext<MessageAttachment[]>([]);

/**
 * What an image in the preview should load: the file itself for an attachment, nothing for one the
 * message doesn't have, and any other URL as it is.
 */
export function resolvePreviewUrl(
  attachments: MessageAttachment[],
  url: string | undefined | null,
): string | undefined {
  if (url?.startsWith(ATTACHMENT_URL_PREFIX)) {
    return findAttachment(attachments, url)?.data_url;
  }
  return url || undefined;
}

export function usePreviewUrl(
  url: string | undefined | null,
): string | undefined {
  return resolvePreviewUrl(useContext(PreviewAttachmentsContext), url);
}

// The formats Discord shows inline. Anything else, SVG included, is shown as a file.
const INLINE_IMAGE_RE = /^data:image\/(png|jpeg|gif|webp)[;,]/;

export function isInlineImage(dataUrl: string): boolean {
  return INLINE_IMAGE_RE.test(dataUrl);
}

/** The size the way Discord shows it next to a file. */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024)
    return `${Math.round((bytes / 1024) * 100) / 100} KB`;
  return formatMB(bytes);
}

const UNSAFE_NAME_CHARS_RE = /[^A-Za-z0-9._-]+/g;

/**
 * A name that Discord keeps as it is, since it turns spaces and the like into
 * underscores and an attachment:// reference only matches the name it stored.
 */
export function sanitizeAttachmentName(name: string): string {
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot).replace(UNSAFE_NAME_CHARS_RE, "") : "";

  const cleaned = base.replace(UNSAFE_NAME_CHARS_RE, "_").replace(/^[._]+/, "");
  // A name in another script has nothing left, so it keeps only its extension.
  return (/[A-Za-z0-9]/.test(cleaned) ? cleaned : "file") + ext;
}

/** The name, or the name with a counter before its extension when another attachment has it. */
export function uniqueAttachmentName(name: string, taken: string[]): string {
  if (!taken.includes(name)) return name;

  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : "";

  for (let i = 1; ; i++) {
    const candidate = `${base}-${i}${ext}`;
    if (!taken.includes(candidate)) return candidate;
  }
}

export function formatMB(bytes: number): string {
  return `${Math.round((bytes / 1024 / 1024) * 100) / 100} MB`;
}

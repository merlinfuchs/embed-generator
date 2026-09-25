import { create } from "zustand";
import type { MessageAttachmentWire } from "../api/wire";
import { immer } from "zustand/middleware/immer";

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

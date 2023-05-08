import { create } from "zustand";
import { MessageAttachmentWire } from "../api/wire";
import { immer } from "zustand/middleware/immer";

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
  }))
);

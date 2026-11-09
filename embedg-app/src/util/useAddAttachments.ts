import { useCallback } from "react";
import {
  MAX_ATTACHMENTS,
  MAX_FILE_BYTES,
  MAX_TOTAL_ATTACHMENT_BYTES,
  type MessageAttachment,
  formatMB,
  sanitizeAttachmentName,
  uniqueAttachmentName,
  useCurrentAttachmentsStore,
} from "../state/attachments";
import { getUniqueId } from ".";
import { useToasts } from "./toasts";

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Adds files to the message's attachments within Discord's limits, telling the user about each one
 * that doesn't fit. Names are rewritten the way Discord would store them, so an attachment://
 * reference to the file keeps working. Resolves with what was added, under the names it ended up
 * with.
 */
export function useAddAttachments() {
  const createToast = useToasts((s) => s.create);

  return useCallback(
    async (files: File[]): Promise<MessageAttachment[]> => {
      const store = useCurrentAttachmentsStore;
      const current = store.getState().attachments;

      let remaining = MAX_ATTACHMENTS - current.length;
      let total = current.reduce((sum, a) => sum + a.size, 0);
      const accepted: File[] = [];

      for (const file of files) {
        if (file.size > MAX_FILE_BYTES) {
          createToast({
            title: "File too large",
            message: `'${file.name}' is larger than the ${formatMB(MAX_FILE_BYTES)} limit.`,
            type: "error",
          });
          continue;
        }
        if (total + file.size > MAX_TOTAL_ATTACHMENT_BYTES) {
          createToast({
            title: "Attachments too large",
            message: `All attachments together can't be larger than ${formatMB(MAX_TOTAL_ATTACHMENT_BYTES)}.`,
            type: "error",
          });
          continue;
        }

        // The count is only known to be full once files are being picked, as several can arrive at
        // once.
        if (remaining <= 0) {
          createToast({
            title: "Too many attachments",
            message: `A message can have at most ${MAX_ATTACHMENTS} attachments.`,
            type: "error",
          });
          break;
        }
        remaining--;
        total += file.size;
        accepted.push(file);
      }

      let dataUrls: string[];
      try {
        dataUrls = await Promise.all(accepted.map(readAsDataUrl));
      } catch {
        createToast({
          title: "Couldn't read the file",
          message: "Try picking it again.",
          type: "error",
        });
        return [];
      }

      const added: MessageAttachment[] = [];
      accepted.forEach((file, i) => {
        const taken = store.getState().attachments.map((a) => a.name);
        const name = uniqueAttachmentName(
          sanitizeAttachmentName(file.name),
          taken,
        );

        const attachment: MessageAttachment = {
          id: getUniqueId(),
          size: file.size,
          name,
          description: null,
          data_url: dataUrls[i],
        };
        store.getState().addAttachment(attachment);
        added.push(attachment);
      });

      return added;
    },
    [createToast],
  );
}

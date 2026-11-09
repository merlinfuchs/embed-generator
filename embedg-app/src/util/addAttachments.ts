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

type LimitError = { title: string; message: string; full?: boolean };

/** Why a file can't join attachments that already take `count` slots and `total` bytes. */
function limitError(
  file: File,
  count: number,
  total: number,
): LimitError | null {
  if (file.size > MAX_FILE_BYTES) {
    return {
      title: "File too large",
      message: `'${file.name}' is larger than the ${formatMB(MAX_FILE_BYTES)} limit.`,
    };
  }
  if (total + file.size > MAX_TOTAL_ATTACHMENT_BYTES) {
    return {
      title: "Attachments too large",
      message: `All attachments together can't be larger than ${formatMB(MAX_TOTAL_ATTACHMENT_BYTES)}.`,
    };
  }
  if (count >= MAX_ATTACHMENTS) {
    return {
      title: "Too many attachments",
      message: `A message can have at most ${MAX_ATTACHMENTS} attachments.`,
      full: true,
    };
  }
  return null;
}

/**
 * Adds files to the message's attachments within Discord's limits, telling the user about each one
 * that doesn't fit. Names are rewritten the way Discord would store them, so an attachment://
 * reference to the file keeps working. Resolves with what was added, under the names it ended up
 * with.
 */
export async function addAttachments(
  files: File[],
): Promise<MessageAttachment[]> {
  const createToast = useToasts.getState().create;
  const store = useCurrentAttachmentsStore;

  // Tells the user why a file doesn't fit, if it doesn't.
  function refuse(file: File, count: number, total: number) {
    const error = limitError(file, count, total);
    if (error) createToast({ ...error, type: "error" });
    return error;
  }

  const current = store.getState().attachments;
  let count = current.length;
  let total = current.reduce((sum, a) => sum + a.size, 0);
  const accepted: File[] = [];

  for (const file of files) {
    const error = refuse(file, count, total);
    if (error?.full) break;
    if (error) continue;
    count++;
    total += file.size;
    accepted.push(file);
  }

  const read = await Promise.allSettled(accepted.map(readAsDataUrl));

  const added: MessageAttachment[] = [];
  accepted.forEach((file, i) => {
    const result = read[i];
    if (result.status === "rejected") {
      createToast({
        title: "Couldn't read the file",
        message: `'${file.name}' couldn't be read. Try picking it again.`,
        type: "error",
      });
      return;
    }

    // Other files may have been added while these were read.
    const attachments = store.getState().attachments;
    const error = refuse(
      file,
      attachments.length,
      attachments.reduce((sum, a) => sum + a.size, 0),
    );
    if (error) return;

    const attachment: MessageAttachment = {
      id: getUniqueId(),
      size: file.size,
      name: uniqueAttachmentName(
        sanitizeAttachmentName(file.name),
        attachments.map((a) => a.name),
      ),
      description: null,
      data_url: result.value,
    };
    store.getState().addAttachment(attachment);
    added.push(attachment);
  });

  return added;
}

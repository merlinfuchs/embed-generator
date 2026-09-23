import { type ChangeEvent, useRef } from "react";
import { messageSchema } from "../discord/importSchema";
import { z } from "zod";
import { useToasts } from "../util/toasts";
import type { SavedMessageWire } from "../api/wire";
import { useImportSavedMessagesMutation } from "../api/mutations";
import { useQueryClient } from "@tanstack/react-query";

const messageExportSchema = z
  .object({
    messages: z.array(
      z.object({
        name: z.string(),
        description: z.string().nullable(),
        data: messageSchema,
      }),
    ),
  })
  .or(
    z
      .object({
        backups: z.array(
          z.object({
            name: z.string(),
            messages: z.array(
              z.object({
                data: messageSchema,
              }),
            ),
          }),
        ),
      })
      .transform((data) => ({
        messages: data.backups.flatMap((b) =>
          b.messages.map((m) => ({
            name: b.name,
            description: null,
            data: m.data,
          })),
        ),
      })),
  );

type MessageExport = z.infer<typeof messageExportSchema>;

interface Props {
  messages: SavedMessageWire[];
  guildId: string | null;
}

export default function MessageExportImport({ messages, guildId }: Props) {
  const importInputRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();

  const createToast = useToasts((state) => state.create);

  const importMutation = useImportSavedMessagesMutation();

  function handleImport(e: ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    if (!input.files) return;

    const files = [...input.files];
    // Reset, or picking the same file again after a failed import does nothing.
    input.value = "";

    for (const file of files) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);

          const parsed = messageExportSchema.safeParse(data);

          if (parsed.success) {
            importMutation.mutate(
              {
                guildId: guildId,
                req: parsed.data,
              },
              {
                onSuccess: (res) => {
                  if (!res.success) {
                    createToast({
                      title: "Failed to import",
                      message: res.error.message,
                      type: "error",
                    });
                    return;
                  }

                  queryClient.invalidateQueries({
                    queryKey: ["saved-messages", guildId],
                  });
                },
              },
            );
          } else {
            console.error(parsed.error);
            createToast({
              title: "Failed to import",
              message: `Data did not match the expected format`,
              type: "error",
            });
          }
        } catch (e) {
          createToast({
            title: "Failed to import",
            message: `Invalid JSON: ${e}`,
            type: "error",
          });
          return;
        }
      };
      reader.readAsText(file);
    }
  }

  function handleExport() {
    const exportData: MessageExport = {
      messages: messages.map((m) => ({
        name: m.name,
        description: m.description,
        data: m.data as any,
      })),
    };

    const data = JSON.stringify(exportData, null, 2);

    const dataUrl = window.URL.createObjectURL(
      new Blob([data], { type: "application/json" }),
    );

    const anchor = document.createElement("a");
    anchor.href = dataUrl;
    anchor.download = "messages.json";
    anchor.click();
    window.URL.revokeObjectURL(dataUrl);
  }

  return (
    <div className="flex space-x-3 justify-end flex-none">
      <button
        className="px-3 py-2 rounded-lg text-white flex-none border-2 border-white/15 hover:bg-white/5 hover:border-white/30 transition-colors"
        onClick={() => importInputRef.current?.click()}
      >
        Import
        <input
          type="file"
          className="hidden"
          ref={importInputRef}
          accept=".json"
          multiple
          onChange={handleImport}
        />
      </button>
      <button
        className="px-3 py-2 rounded-lg text-white flex-none border-2 border-white/15 hover:bg-white/5 hover:border-white/30 transition-colors"
        onClick={handleExport}
      >
        Export All
      </button>
    </div>
  );
}

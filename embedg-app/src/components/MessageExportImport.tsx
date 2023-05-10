import { ChangeEvent, useRef } from "react";
import { messageSchema } from "../discord/restoreSchema";
import { z } from "zod";
import { useToasts } from "../util/toasts";
import { SavedMessageWire } from "../api/wire";
import { useImportSavedMessagesMutation } from "../api/mutations";
import { useQueryClient } from "react-query";

const messageExportSchema = z
  .object({
    messages: z.array(
      z.object({
        name: z.string(),
        description: z.string().nullable(),
        data: messageSchema,
      })
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
              })
            ),
          })
        ),
      })
      .transform((data) => ({
        messages: data.backups.flatMap((b) =>
          b.messages.map((m) => ({
            name: b.name,
            description: null,
            data: m.data,
          }))
        ),
      }))
  );

type MessageExport = z.infer<typeof messageExportSchema>;

interface Props {
  messages: SavedMessageWire[];
  guildId: string | null;
}

export default function MessageExportImport({ messages, guildId }: Props) {
  const importInputRef = useRef<HTMLInputElement>(null);
  const exportAnchorRef = useRef<HTMLAnchorElement>(null);

  const queryClient = useQueryClient();

  const createToast = useToasts((state) => state.create);

  const importMutation = useImportSavedMessagesMutation();

  function handleImport(e: ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;

    for (let i = 0; i < e.target.files.length; i++) {
      const file = e.target.files[i];

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
                onSuccess: () => {
                  queryClient.invalidateQueries(["saved-messages", guildId]);
                },
              }
            );
          } else {
            console.log(parsed.error);
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
      new Blob([data], { type: "application/json" })
    );

    if (exportAnchorRef.current) {
      exportAnchorRef.current.href = dataUrl;
      exportAnchorRef.current.click();
    }
  }

  return (
    <div className="flex space-x-3 justify-end flex-none">
      <button
        className="px-3 py-2 rounded text-white flex-none border-2 border-dark-7 hover:bg-dark-6"
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
        className="px-3 py-2 rounded text-white flex-none border-2 border-dark-7 hover:bg-dark-6"
        onClick={handleExport}
      >
        Export All
        <a
          href=""
          ref={exportAnchorRef}
          download="messages.json"
          className="hidden"
        ></a>
      </button>
    </div>
  );
}

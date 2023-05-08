import { ChangeEvent, useRef } from "react";
import { messageSchema } from "../discord/schema";
import { z } from "zod";

const messageExportSchema = z.object({
  messages: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      data: messageSchema,
    })
  ),
});

const messageExportDiscohookSchema = z.object({
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
});

export default function MessageExportImport() {
  const importInputRef = useRef<HTMLInputElement>(null);

  function handleImport(e: ChangeEvent<HTMLInputElement>) {}

  function handleExport() {}

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
      </button>
    </div>
  );
}

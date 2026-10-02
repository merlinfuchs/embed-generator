import clsx from "clsx";
import { parseISO } from "date-fns";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useSavedMessageVersionQuery,
  useSavedMessageVersionsQuery,
} from "../api/queries";
import type { SavedMessageWire } from "../api/wire";
import { parseMessageWithAction } from "../discord/importSchema";
import { setCurrentMessage } from "../state/currentMessage";
import MessagePreview from "./MessagePreview";
import Modal from "./Modal";

export default function SavedMessageHistory({
  message,
  guildId,
  maxVersions,
  onClose,
}: {
  message: SavedMessageWire;
  guildId: string | null;
  maxVersions: number;
  onClose: () => void;
}) {
  const navigate = useNavigate();

  const versionsQuery = useSavedMessageVersionsQuery(message.id, guildId);
  const versions = versionsQuery.data?.success ? versionsQuery.data.data : [];

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const versionId = selectedId ?? versions[0]?.id ?? null;
  const versionQuery = useSavedMessageVersionQuery(
    message.id,
    versionId,
    guildId,
  );

  const parsed = useMemo(() => {
    if (versionQuery.isError) return { error: `${versionQuery.error}` };
    if (!versionQuery.data) return null;
    if (!versionQuery.data.success) {
      return { error: versionQuery.data.error.message };
    }
    try {
      return { msg: parseMessageWithAction(versionQuery.data.data.data) };
    } catch (e) {
      return { error: `${e}` };
    }
  }, [versionQuery.data, versionQuery.isError, versionQuery.error]);

  function restore() {
    if (!parsed?.msg) return;
    setCurrentMessage(parsed.msg);
    navigate("/editor");
  }

  let body: React.ReactNode;
  if (versionsQuery.isError) {
    body = <div className="text-red text-sm">{`${versionsQuery.error}`}</div>;
  } else if (versionsQuery.data && !versionsQuery.data.success) {
    body = (
      <div className="text-red text-sm">{versionsQuery.data.error.message}</div>
    );
  } else if (versionsQuery.isPending) {
    body = <div className="text-mist-400 text-sm">Loading versions...</div>;
  } else if (versions.length === 0) {
    body = (
      <div className="text-mist-400 text-sm">
        No earlier versions yet. Each time you overwrite the message, the
        version it replaces is kept here.
      </div>
    );
  } else {
    body = (
      <div className="flex flex-col sm:flex-row gap-3">
        {/* A row of versions is too wide for small screens. */}
        <select
          aria-label="Version"
          className="sm:hidden bg-ink-900 rounded-lg p-2 w-full font-light cursor-pointer text-white"
          value={versionId ?? ""}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          {versions.map((version) => (
            <option key={version.id} value={version.id}>
              {parseISO(version.created_at).toLocaleString() +
                (version.name !== message.name ? ` · ${version.name}` : "")}
            </option>
          ))}
        </select>
        <div className="hidden sm:flex flex-col gap-1 flex-none w-48 overflow-y-auto max-h-[500px]">
          {versions.map((version) => (
            <button
              key={version.id}
              type="button"
              className={clsx(
                "text-left rounded-lg px-3 py-2 cursor-pointer",
                version.id === versionId
                  ? "bg-ink-900 text-white"
                  : "text-mist-300 hover:bg-ink-800",
              )}
              onClick={() => setSelectedId(version.id)}
            >
              <div className="text-sm whitespace-nowrap">
                {parseISO(version.created_at).toLocaleString()}
              </div>
              {version.name !== message.name && (
                <div className="text-xs text-mist-400 truncate">
                  {version.name}
                </div>
              )}
            </button>
          ))}
        </div>
        <div className="rounded-lg bg-ink-800 overflow-y-auto flex-auto max-h-[300px] sm:max-h-[500px] px-5 py-3 text-white">
          {parsed?.msg ? (
            <MessagePreview msg={parsed.msg} />
          ) : parsed?.error ? (
            <div className="text-red text-sm">{parsed.error}</div>
          ) : (
            <div className="text-mist-400 text-sm">Loading version...</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <Modal width="md" onClose={onClose}>
      <div className="p-4 space-y-4">
        <div className="pr-8">
          <div className="text-white truncate">History of {message.name}</div>
          <div className="text-mist-300 text-sm whitespace-normal">
            The last {maxVersions} versions from before the message was
            overwritten. Restoring one replaces the message in the editor.
          </div>
        </div>
        {body}
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            className="px-3 py-2 rounded-lg text-mist-100 border-2 border-white/15 hover:bg-white/5 hover:border-white/30 transition-colors"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-3 py-2 rounded-lg bg-azure-500 hover:bg-azure-400 text-white font-medium transition-colors disabled:bg-ink-900 disabled:text-mist-400 disabled:cursor-not-allowed"
            disabled={!parsed?.msg}
            onClick={restore}
          >
            Restore
          </button>
        </div>
      </div>
    </Modal>
  );
}

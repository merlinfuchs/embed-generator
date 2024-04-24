import { ReactNode, useState } from "react";
import Modal from "./Modal";
import { ChannelSelect } from "./ChannelSelect";
import { RoleSelect } from "./RoleSelect";

interface Props {
  children: ReactNode;
  onMentionInsert: (mention: string) => void;
  guildId: string | null;
}

function removeNonDigits(v: string): string {
  return v.replace(/\D/g, "");
}

export default function EditorMentionPicker({
  children,
  guildId,
  onMentionInsert,
}: Props) {
  const [open, setOpen] = useState(false);

  const [channelId, setChannelId] = useState("");
  const [roleId, setRoleId] = useState("");
  const [userId, setUserId] = useState("");

  function mention(prefix: string, id: string) {
    if (!id) return;
    onMentionInsert(`<${prefix}${id}>`);
    setOpen(false);
  }

  return (
    <div>
      <div onClick={() => setOpen(true)}>{children}</div>
      {open && (
        <Modal height="auto" width="sm" onClose={() => setOpen(false)}>
          <div className="p-4">
            <div className="text-lg text-white mb-1">Add a mention</div>
            <div className="text-gray-400 mb-6">
              Mention a channel, role, or user in your message.
            </div>
            <div className="mb-6 space-y-3">
              <div className="flex space-x-2">
                <div className="flex-auto">
                  {guildId ? (
                    <ChannelSelect
                      guildId={guildId}
                      channelId={channelId || null}
                      onChange={(v) => setChannelId(v || "")}
                    />
                  ) : (
                    <input
                      type="text"
                      className="px-3 py-2 bg-dark-2 rounded w-full focus:outline-none text-white"
                      placeholder="channel id"
                      value={channelId}
                      onChange={(e) =>
                        setChannelId(removeNonDigits(e.target.value))
                      }
                    />
                  )}
                </div>
                <button
                  className="px-3 py-2 rounded text-white bg-blurple hover:bg-blurple-dark flex-none"
                  onClick={() => mention("#", channelId)}
                >
                  Mention channel
                </button>
              </div>
              <div className="flex space-x-2">
                <div className="flex-auto">
                  {guildId ? (
                    <RoleSelect
                      guildId={guildId}
                      roleId={roleId || ""}
                      onChange={(v) => setRoleId(v || "")}
                    />
                  ) : (
                    <input
                      type="text"
                      className="px-3 py-2 bg-dark-2 rounded w-full focus:outline-none text-white"
                      placeholder="role id"
                      value={roleId}
                      onChange={(e) =>
                        setRoleId(removeNonDigits(e.target.value))
                      }
                    />
                  )}
                </div>
                <button
                  className="px-3 py-2 rounded text-white bg-blurple hover:bg-blurple-dark flex-none"
                  onClick={() => mention("@&", roleId)}
                >
                  Mention Role
                </button>
              </div>
              <div className="flex space-x-2">
                <input
                  type="text"
                  className="px-3 py-2 bg-dark-2 rounded w-full focus:outline-none text-white"
                  placeholder="enter a user id"
                  value={userId}
                  onChange={(e) => setUserId(removeNonDigits(e.target.value))}
                />
                <button
                  className="px-3 py-2 rounded text-white bg-blurple hover:bg-blurple-dark flex-none"
                  onClick={() => mention("@", userId)}
                >
                  Mention User
                </button>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                className="px-3 py-2 rounded text-white bg-dark-6 hover:bg-dark-7"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

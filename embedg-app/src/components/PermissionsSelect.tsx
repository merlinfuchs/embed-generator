import { useMemo, useState } from "react";
import ClickOutsideHandler from "./ClickOutsideHandler";
import {
  CheckIcon,
  ChevronDownIcon,
  ShieldExclamationIcon,
} from "@heroicons/react/20/solid";
import clsx from "clsx";

interface Props {
  permissions: string;
  onChange: (permissions: string) => void;
}

const permissionFlags: Record<string, bigint> = {
  CREATE_INSTANT_INVITE: BigInt("0x0000000000000001"),
  KICK_MEMBERS: BigInt("0x0000000000000002"),
  BAN_MEMBERS: BigInt("0x0000000000000004"),
  ADMINISTRATOR: BigInt("0x0000000000000008"),
  MANAGE_CHANNELS: BigInt("0x0000000000000010"),
  MANAGE_GUILD: BigInt("0x0000000000000020"),
  ADD_REACTIONS: BigInt("0x0000000000000040"),
  VIEW_AUDIT_LOG: BigInt("0x0000000000000080"),
  PRIORITY_SPEAKER: BigInt("0x0000000000000100"),
  STREAM: BigInt("0x0000000000000200"),
  VIEW_CHANNEL: BigInt("0x0000000000000400"),
  SEND_MESSAGES: BigInt("0x0000000000000800"),
  SEND_TTS_MESSAGES: BigInt("0x0000000000001000"),
  MANAGE_MESSAGES: BigInt("0x0000000000002000"),
  EMBED_LINKS: BigInt("0x0000000000004000"),
  ATTACH_FILES: BigInt("0x0000000000008000"),
  READ_MESSAGE_HISTORY: BigInt("0x0000000000010000"),
  MENTION_EVERYONE: BigInt("0x0000000000020000"),
  USE_EXTERNAL_EMOJIS: BigInt("0x0000000000040000"),
  VIEW_GUILD_INSIGHTS: BigInt("0x0000000000080000"),
  CONNECT: BigInt("0x0000000000100000"),
  SPEAK: BigInt("0x0000000000200000"),
  MUTE_MEMBERS: BigInt("0x0000000000400000"),
  DEAFEN_MEMBERS: BigInt("0x0000000000800000"),
  MOVE_MEMBERS: BigInt("0x0000000001000000"),
  USE_VAD: BigInt("0x0000000002000000"),
  CHANGE_NICKNAME: BigInt("0x0000000004000000"),
  MANAGE_NICKNAMES: BigInt("0x0000000008000000"),
  MANAGE_ROLES: BigInt("0x0000000010000000"),
  MANAGE_WEBHOOKS: BigInt("0x0000000020000000"),
  MANAGE_GUILD_EXPRESSIONS: BigInt("0x0000000040000000"),
  USE_APPLICATION_COMMANDS: BigInt("0x0000000080000000"),
  REQUEST_TO_SPEAK: BigInt("0x0000000100000000"),
  MANAGE_EVENTS: BigInt("0x0000000200000000"),
  MANAGE_THREADS: BigInt("0x0000000400000000"),
  CREATE_PUBLIC_THREADS: BigInt("0x0000000800000000"),
  CREATE_PRIVATE_THREADS: BigInt("0x0000001000000000"),
  USE_EXTERNAL_STICKERS: BigInt("0x0000002000000000"),
  SEND_MESSAGES_IN_THREADS: BigInt("0x0000004000000000"),
  USE_EMBEDDED_ACTIVITIES: BigInt("0x0000008000000000"),
  MODERATE_MEMBERS: BigInt("0x0000010000000000"),
  VIEW_CREATOR_MONETIZATION_ANALYTICS: BigInt("0x0000020000000000"),
  USE_SOUNDBOARD: BigInt("0x0000040000000000"),
  CREATE_GUILD_EXPRESSIONS: BigInt("0x0000080000000000"),
  CREATE_EVENTS: BigInt("0x0000100000000000"),
  USE_EXTERNAL_SOUNDS: BigInt("0x0000200000000000"),
  SEND_VOICE_MESSAGES: BigInt("0x0000400000000000"),
  SEND_POLLS: BigInt("0x0002000000000000"),
};

export default function PermissionsSelect({ permissions, onChange }: Props) {
  const permissionsInt = useMemo(() => BigInt(permissions), [permissions]);

  const activeFlags = useMemo(
    () =>
      Object.keys(permissionFlags).filter(
        (f) => permissionsInt & permissionFlags[f]
      ),
    [permissionsInt]
  );

  function togglePermission(flag: string) {
    if (permissionsInt & permissionFlags[flag]) {
      onChange((permissionsInt ^ permissionFlags[flag]).toString());
      return;
    } else {
      onChange((permissionsInt | permissionFlags[flag]).toString());
    }
  }

  const [open, setOpen] = useState(false);

  return (
    <ClickOutsideHandler onClickOutside={() => setOpen(false)}>
      <div className="px-3 h-10 flex items-center rounded bg-dark-2 relative select-none">
        <div
          role="button"
          onClick={() => setOpen((prev) => !prev)}
          className="flex-auto"
        >
          {activeFlags.length ? (
            <div className="flex items-center space-x-2 cursor-pointer w-full">
              <div className="flex-auto flex space-x-2 items-center">
                <ShieldExclamationIcon className="h-5 w-5 text-gray-500" />
                <div className="text-gray-300 truncate">
                  {activeFlags[0].replaceAll("_", " ")}
                </div>
                {activeFlags.length > 1 && (
                  <div className="text-gray-400 font-light">
                    + {activeFlags.length - 1} others
                  </div>
                )}
              </div>
              <ChevronDownIcon
                className={clsx(
                  "text-white w-5 h-5 flex-none transition-transform",
                  open && "rotate-180"
                )}
              />
            </div>
          ) : (
            <div className="text-gray-300">Select permissions</div>
          )}
        </div>
        {open && (
          <div className="absolute bg-dark-2 top-14 left-0 rounded shadow-lg w-full border-2 border-dark-2 z-10 max-h-48 overflow-y-auto overflow-x-none">
            {Object.keys(permissionFlags).map((f) => (
              <div
                key={f}
                className={clsx(
                  "py-2 flex space-x-2 items-center hover:bg-dark-3 hover:bg-opacity-100 rounded cursor-pointer px-3",
                  activeFlags.includes(f) && "bg-dark-3 bg-opacity-50"
                )}
                role="button"
                onClick={() => togglePermission(f)}
              >
                <ShieldExclamationIcon className="h-5 w-5 text-gray-500" />
                <div className="text-gray-300 truncate flex-auto">
                  {f.replaceAll("_", " ")}
                </div>
                {activeFlags.includes(f) && (
                  <CheckIcon className="h-5 w-5 text-gray-300" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </ClickOutsideHandler>
  );
}

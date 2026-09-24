import { CheckIcon, ChevronDownIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import { useMemo, useState } from "react";
import ClickOutsideHandler from "./ClickOutsideHandler";
import SelectDropdown from "./SelectDropdown";
import { useGuildRolesQuery } from "../api/queries";
import { colorIntToHex } from "../util/discord";

interface Props {
  guildId: string | null;
  roleIds: string[];
  onChange: (roleId: string[]) => void;
}

export function RolesSelect({ guildId, roleIds, onChange }: Props) {
  const { data: roles } = useGuildRolesQuery(guildId);

  const firstRole = useMemo(
    () => roles?.success && roles.data.find((r) => r.id === roleIds[0]),
    [roles, roleIds[0]],
  );

  function toggleRole(roleId: string) {
    if (roleIds.includes(roleId)) {
      onChange(roleIds.filter((r) => r !== roleId));
      return;
    } else {
      onChange([...roleIds, roleId]);
    }
  }

  const [open, setOpen] = useState(false);

  return (
    <ClickOutsideHandler onClickOutside={() => setOpen(false)}>
      <div className="px-3 h-10 flex items-center rounded-lg bg-ink-900 relative select-none">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="flex-auto text-left"
        >
          {firstRole ? (
            <div className="flex items-center space-x-2 cursor-pointer w-full">
              <div className="flex-auto flex space-x-2 items-center">
                <div
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: colorIntToHex(firstRole.color) }}
                ></div>
                <div className="text-mist-300 truncate">{firstRole.name}</div>
                {roleIds.length > 1 && (
                  <div className="text-mist-400 font-light">
                    + {roleIds.length - 1} others
                  </div>
                )}
              </div>
              <ChevronDownIcon
                className={clsx(
                  "text-white w-5 h-5 flex-none transition-transform",
                  open && "rotate-180",
                )}
              />
            </div>
          ) : (
            <div className="text-mist-300">Select roles</div>
          )}
        </button>
        {open && (
          <SelectDropdown>
            {roles?.success && roles.data.length ? (
              roles.data.map((r) => (
                <button
                  type="button"
                  key={r.id}
                  className={clsx(
                    "py-2 flex space-x-2 items-center hover:bg-ink-700 rounded-lg cursor-pointer px-3 w-full text-left",
                    roleIds.includes(r.id) && "bg-ink-700/50",
                  )}
                  onClick={() => toggleRole(r.id)}
                >
                  <div
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: colorIntToHex(r.color) }}
                  ></div>
                  <div className="text-mist-300 truncate flex-auto">
                    {r.name}
                  </div>
                  {roleIds.includes(r.id) && (
                    <CheckIcon className="h-5 w-5 text-mist-300" />
                  )}
                </button>
              ))
            ) : (
              <div className="p-2 text-mist-300">No roles found</div>
            )}
          </SelectDropdown>
        )}
      </div>
    </ClickOutsideHandler>
  );
}

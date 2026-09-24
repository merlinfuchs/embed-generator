import { ChevronDownIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import { useMemo, useState } from "react";
import ClickOutsideHandler from "./ClickOutsideHandler";
import SelectDropdown from "./SelectDropdown";
import { useGuildRolesQuery } from "../api/queries";
import { colorIntToHex } from "../util/discord";

interface Props {
  guildId: string | null;
  roleId: string | null;
  onChange: (roleId: string | null) => void;
}

export function RoleSelect({ guildId, roleId, onChange }: Props) {
  const { data: roles } = useGuildRolesQuery(guildId);

  const role = useMemo(
    () => roles?.success && roles.data.find((r) => r.id === roleId),
    [roles, roleId],
  );

  function selectRole(roleId: string) {
    onChange(roleId);
    setOpen(false);
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
          {role ? (
            <div className="flex items-center space-x-2 cursor-pointer w-full">
              <div
                className="h-4 w-4 rounded-full"
                style={{ backgroundColor: colorIntToHex(role.color) }}
              ></div>
              <div className="text-mist-300 flex-auto truncate">
                {role.name}
              </div>
              <ChevronDownIcon
                className={clsx(
                  "text-white w-5 h-5 flex-none transition-transform",
                  open && "rotate-180",
                )}
              />
            </div>
          ) : (
            <div className="text-mist-300">Select role</div>
          )}
        </button>
        {open && (
          <SelectDropdown>
            {roles?.success && roles.data.length ? (
              roles.data.map((r) => (
                <button
                  type="button"
                  key={r.id}
                  className="py-2 flex space-x-2 items-center hover:bg-ink-700 rounded-lg cursor-pointer px-3 w-full text-left"
                  onClick={() => selectRole(r.id)}
                >
                  <div
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: colorIntToHex(r.color) }}
                  ></div>
                  <div className="text-mist-300 truncate">{r.name}</div>
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

import { CheckIcon, ChevronDownIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
import ClickOutsideHandler from "./ClickOutsideHandler";
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
    [roles, roleIds[0]]
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

  useEffect(() => {
    if (roles?.success) {
      roles.data.sort((a, b) => b.position - a.position);
    }
  }, [roles]);

  return (
    <ClickOutsideHandler onClickOutside={() => setOpen(false)}>
      <div className="px-3 h-10 flex items-center rounded bg-dark-2 relative select-none">
        <div
          role="button"
          onClick={() => setOpen((prev) => !prev)}
          className="flex-auto"
        >
          {firstRole ? (
            <div className="flex items-center space-x-2 cursor-pointer w-full">
              <div className="flex-auto flex space-x-2 items-center">
                <div
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: colorIntToHex(firstRole.color) }}
                ></div>
                <div className="text-gray-300 truncate">{firstRole.name}</div>
                {roleIds.length > 1 && (
                  <div className="text-gray-400 font-light">
                    + {roleIds.length - 1} others
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
            <div className="text-gray-300">Select roles</div>
          )}
        </div>
        {open && (
          <div className="absolute bg-dark-2 top-14 left-0 rounded shadow-lg w-full border-2 border-dark-2 z-10 max-h-48 overflow-y-auto overflow-x-none">
            {roles?.success && roles.data.length ? (
              roles.data.map((r) => (
                <div
                  key={r.id}
                  className={clsx(
                    "py-2 flex space-x-2 items-center hover:bg-dark-3 hover:bg-opacity-100 rounded cursor-pointer px-3",
                    roleIds.includes(r.id) && "bg-dark-3 bg-opacity-50"
                  )}
                  role="button"
                  onClick={() => toggleRole(r.id)}
                >
                  <div
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: colorIntToHex(r.color) }}
                  ></div>
                  <div className="text-gray-300 truncate flex-auto">
                    {r.name}
                  </div>
                  {roleIds.includes(r.id) && (
                    <CheckIcon className="h-5 w-5 text-gray-300" />
                  )}
                </div>
              ))
            ) : (
              <div className="p-2 text-gray-300">No roles found</div>
            )}
          </div>
        )}
      </div>
    </ClickOutsideHandler>
  );
}

import { ChevronDownIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
import ClickOutsideHandler from "./ClickOutsideHandler";
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
    [roles, roleId]
  );

  function selectRole(roleId: string) {
    onChange(roleId);
    setOpen(false);
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
          {role ? (
            <div className="flex items-center space-x-2 cursor-pointer w-full">
              <div
                className="h-4 w-4 rounded-full"
                style={{ backgroundColor: colorIntToHex(role.color) }}
              ></div>
              <div className="text-gray-300 flex-auto truncate">
                {role.name}
              </div>
              <ChevronDownIcon
                className={clsx(
                  "text-white w-5 h-5 flex-none transition-transform",
                  open && "rotate-180"
                )}
              />
            </div>
          ) : (
            <div className="text-gray-300">Select role</div>
          )}
        </div>
        {open && (
          <div className="absolute bg-dark-2 top-14 left-0 rounded shadow-lg w-full border-2 border-dark-2 z-10 max-h-48 overflow-y-auto overflow-x-none">
            {roles?.success && roles.data.length ? (
              roles.data.map((r) => (
                <div
                  key={r.id}
                  className="py-2 flex space-x-2 items-center hover:bg-dark-3 rounded cursor-pointer px-3"
                  role="button"
                  onClick={() => selectRole(r.id)}
                >
                  <div
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: colorIntToHex(r.color) }}
                  ></div>
                  <div className="text-gray-300 truncate">{r.name}</div>
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

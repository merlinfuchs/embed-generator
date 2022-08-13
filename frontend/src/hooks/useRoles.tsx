import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { RoleWire } from "../api/wire";
import useAPIClient from "./useApiClient";
import useSelectedGuild from "./useSelectedGuild";

const RolesContext = createContext<RoleWire[] | null>(null);

export const RolesProvider = ({ children }: { children: ReactNode }) => {
  const [roles, setRoles] = useState<RoleWire[] | null>(null);
  const [selectedGuild] = useSelectedGuild();

  const client = useAPIClient();
  useEffect(() => {
    if (client.token && selectedGuild) {
      client.getGuildRoles(selectedGuild).then((resp) => {
        if (resp.success) {
          setRoles(
            resp.data.filter((r) => !r.managed && r.id !== selectedGuild)
          );
        }
      });
    } else {
      setRoles(null);
    }
  }, [client, selectedGuild]);

  return (
    <RolesContext.Provider value={roles}>{children}</RolesContext.Provider>
  );
};

export default function useRoles() {
  return useContext(RolesContext);
}

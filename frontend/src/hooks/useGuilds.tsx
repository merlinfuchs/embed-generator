import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { GuildWire } from "../api/wire";
import useAPIClient from "./useApiClient";

const GuildsContext = createContext<GuildWire[] | null>(null);

export const GuildsProvider = ({ children }: { children: ReactNode }) => {
  const [guilds, setGuilds] = useState<GuildWire[] | null>(null);

  const client = useAPIClient();
  useEffect(() => {
    if (client.token) {
      client.getGuilds().then((resp) => {
        if (resp.success) {
          setGuilds(resp.data);
        }
      });
    } else {
      setGuilds(null);
    }
  }, [client]);

  return (
    <GuildsContext.Provider value={guilds}>{children}</GuildsContext.Provider>
  );
};

export default function useGuilds() {
  return useContext(GuildsContext);
}

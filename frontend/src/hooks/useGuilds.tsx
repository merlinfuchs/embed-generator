import { createContext, useContext, useState, ReactNode } from "react";
import useAPIClient from "./useApiClient";

const GuildsContext = createContext<{}[] | null>(null);

export const GuildsProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<{}[] | null>(null);

  const client = useAPIClient();
  if (client) {
    client.getGuilds().then((user) => setUser(user));
  } else {
    setUser(null);
  }

  return (
    <GuildsContext.Provider value={user}>{children}</GuildsContext.Provider>
  );
};

export default function useGuilds() {
  return useContext(GuildsContext);
}

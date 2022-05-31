import { createContext, useContext, useState, ReactNode } from "react";
import useAPIClient from "./useApiClient";

const UserContext = createContext<{} | null>(null);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<{} | null>(null);

  const client = useAPIClient();
  if (client) {
    client.getUser().then((user) => setUser(user));
  } else {
    setUser(null);
  }

  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
};

export function useUser() {
  return useContext(UserContext);
}

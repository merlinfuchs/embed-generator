import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { UserWire } from "../api/wire";
import useAPIClient from "./useApiClient";

const UserContext = createContext<UserWire | null>(null);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserWire | null>(null);

  const client = useAPIClient();
  useEffect(() => {
    if (client.token) {
      client.getUser().then((resp) => {
        if (resp.success) {
          setUser(resp.data);
        }
      });
    } else if (user) {
      setUser(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client]);

  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
};

export default function useUser() {
  return useContext(UserContext);
}

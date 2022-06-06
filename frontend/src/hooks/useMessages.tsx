import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { MessageWire } from "../api/wire";
import useAPIClient from "./useApiClient";

const MessagesContext = createContext<MessageWire[] | null>(null);

export const MessagesProvider = ({ children }: { children: ReactNode }) => {
  const [messages, setMessages] = useState<MessageWire[] | null>(null);

  const client = useAPIClient();
  useEffect(() => {
    if (client.token) {
      client.getMessages().then((resp) => {
        if (resp.success) {
          setMessages(resp.data);
        }
      });
    } else {
      setMessages(null);
    }
  }, [client]);

  return (
    <MessagesContext.Provider value={messages}>
      {children}
    </MessagesContext.Provider>
  );
};

export default function useMessages() {
  return useContext(MessagesContext);
}

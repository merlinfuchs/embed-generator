import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { EmojiWire } from "../api/wire";
import useAPIClient from "./useApiClient";
import useSelectedGuild from "./useSelectedGuild";

const EmojisContext = createContext<EmojiWire[] | null>(null);

export const EmojisProvider = ({ children }: { children: ReactNode }) => {
  const [emojis, setEmojis] = useState<EmojiWire[] | null>(null);
  const [selectedGuild] = useSelectedGuild();

  const client = useAPIClient();
  useEffect(() => {
    if (client.token && selectedGuild) {
      client.getGuildEmojis(selectedGuild).then((resp) => {
        if (resp.success) {
          setEmojis(resp.data.filter((e) => e.available));
        }
      });
    } else {
      setEmojis(null);
    }
  }, [client, selectedGuild]);

  return (
    <EmojisContext.Provider value={emojis}>{children}</EmojisContext.Provider>
  );
};

export default function useEmojis() {
  return useContext(EmojisContext);
}

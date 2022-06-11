import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { ChannelWire } from "../api/wire";
import useAPIClient from "./useApiClient";
import useSelectedGuild from "./useSelectedGuild";

const channelTypes = new Set([0, 5, 10, 11, 12]);

const ChannelsContext = createContext<ChannelWire[] | null>(null);

export const ChannelsProvider = ({ children }: { children: ReactNode }) => {
  const [channels, setChannels] = useState<ChannelWire[] | null>(null);
  const [selectedGuild] = useSelectedGuild();

  const client = useAPIClient();
  useEffect(() => {
    if (client.token && selectedGuild) {
      client.getGuildChannels(selectedGuild).then((resp) => {
        if (resp.success) {
          setChannels(resp.data.filter((c) => channelTypes.has(c.type)));
        }
      });
    } else {
      setChannels(null);
    }
  }, [client, selectedGuild]);

  return (
    <ChannelsContext.Provider value={channels}>
      {children}
    </ChannelsContext.Provider>
  );
};

export default function useChannels() {
  return useContext(ChannelsContext);
}

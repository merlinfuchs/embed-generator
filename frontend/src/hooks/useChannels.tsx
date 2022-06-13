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

const ChannelsContext = createContext<
  (ChannelWire & { indent: number })[] | null
>(null);

const positionSort = (a: ChannelWire, b: ChannelWire) =>
  a.position > b.position ? 1 : -1;

export const ChannelsProvider = ({ children }: { children: ReactNode }) => {
  const [channels, setChannels] = useState<
    (ChannelWire & { indent: number })[] | null
  >(null);
  const [selectedGuild] = useSelectedGuild();

  const client = useAPIClient();
  useEffect(() => {
    if (client.token && selectedGuild) {
      client.getGuildChannels(selectedGuild).then((resp) => {
        if (resp.success) {
          // this code is terrible but it seems to work and I don't want to deal with this anymore

          const channels = Object.fromEntries(resp.data.map((c) => [c.id, c]));

          const channelTree: any = {};

          for (const channel of Object.values(channels)
            .filter((c) => !c.parent_id)
            .sort((a, b) =>
              a.type === 4 && b.type !== 4
                ? 1
                : b.type === 4 && a.type !== 4
                ? -1
                : positionSort(a, b)
            )) {
            channelTree[channel.id] = {};
          }

          for (const channel of Object.values(channels)
            .filter((c) => [0, 5, 15].includes(c.type))
            .sort(positionSort)) {
            if (channel.parent_id) {
              channelTree[channel.parent_id] = {
                ...(channelTree[channel.parent_id] || {}),
              };
              channelTree[channel.parent_id][channel.id] = {};
            }
          }

          for (const channel of Object.values(channels)
            .filter((c) => [10, 11, 12].includes(c.type))
            .sort(positionSort)) {
            if (channel.parent_id) {
              const parent = channels[channel.parent_id];
              if (parent && parent.parent_id) {
                channelTree[parent.parent_id] = {
                  ...(channelTree[parent.parent_id] || {}),
                };
                channelTree[parent.parent_id][channel.parent_id] = {
                  ...(channelTree[parent.parent_id][channel.parent_id] || {}),
                };
                channelTree[parent.parent_id][channel.parent_id][channel.id] =
                  {};
              } else {
                channelTree[channel.parent_id] = {
                  ...(channelTree[channel.parent_id] || {}),
                };
                channelTree[channel.parent_id][channel.id] = {};
              }
            }
          }

          const result: (ChannelWire & { indent: number })[] = [];
          for (const [id, aChildren] of Object.entries(channelTree)) {
            result.push({ indent: 0, ...channels[id] });
            for (const [id, bChildren] of Object.entries(aChildren as any)) {
              result.push({ indent: 1, ...channels[id] });
              for (const [id] of Object.entries(bChildren as any)) {
                result.push({ indent: 2, ...channels[id] });
              }
            }
          }

          setChannels(result);
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

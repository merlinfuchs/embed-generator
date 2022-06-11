import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { StickerWire } from "../api/wire";
import useAPIClient from "./useApiClient";
import useSelectedGuild from "./useSelectedGuild";

const StickersContext = createContext<StickerWire[] | null>(null);

export const StickersProvider = ({ children }: { children: ReactNode }) => {
  const [stickers, setStickers] = useState<StickerWire[] | null>(null);
  const [selectedGuild] = useSelectedGuild();

  const client = useAPIClient();
  useEffect(() => {
    if (client.token && selectedGuild) {
      client.getGuildStickers(selectedGuild).then((resp) => {
        if (resp.success) {
          setStickers(resp.data);
        }
      });
    } else {
      setStickers(null);
    }
  }, [client, selectedGuild]);

  return (
    <StickersContext.Provider value={stickers}>
      {children}
    </StickersContext.Provider>
  );
};

export default function useStickers() {
  return useContext(StickersContext);
}

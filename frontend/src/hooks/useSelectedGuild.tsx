import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import useGuilds from "./useGuilds";

const SelectedGuildContext = createContext<
  [string | null, (newGuild: string | null) => void]
>([null, () => {}]);

export const SelectedGuildProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [guild, setGuild] = useState<string | null>(null);
  const guilds = useGuilds();

  useEffect(() => {
    setGuild(null);
  }, [guilds]);

  return (
    <SelectedGuildContext.Provider value={[guild, setGuild]}>
      {children}
    </SelectedGuildContext.Provider>
  );
};

export default function useSelectedGuild(): [
  null | string,
  (newGuild: null | string) => void
] {
  return useContext(SelectedGuildContext);
}

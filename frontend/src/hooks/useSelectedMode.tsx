import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useRef,
  useEffect,
} from "react";
import useToken from "./useToken";

const SelectedModeContext = createContext<
  ["webhook" | "channel", (newToken: "webhook" | "channel") => void]
>(["webhook", () => {}]);

export const SelectedModeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<"webhook" | "channel">("webhook");
  const [token] = useToken();

  const manuallyChanged = useRef(false);
  const wrappedSetMode = (newMode: "webhook" | "channel") => {
    setMode(newMode);
    manuallyChanged.current = true;
  };

  useEffect(() => {
    if (token && !manuallyChanged.current && mode === "webhook") {
      setMode("channel");
    } else if (!token && mode === "channel") {
      setMode("webhook");
    }
  }, [token, mode]);

  return (
    <SelectedModeContext.Provider value={[mode, wrappedSetMode]}>
      {children}
    </SelectedModeContext.Provider>
  );
};

export default function useSelectedMode(): [
  "webhook" | "channel",
  (newMode: "webhook" | "channel") => void
] {
  return useContext(SelectedModeContext);
}

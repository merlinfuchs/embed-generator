import { createContext, useContext, useState, ReactNode } from "react";

const SelectedModeContext = createContext<
  ["webhook" | "channel", (newToken: "webhook" | "channel") => void]
>(["webhook", () => {}]);

export const SelectedModeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<"webhook" | "channel">("webhook");

  return (
    <SelectedModeContext.Provider value={[mode, setMode]}>
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

import { createContext, useContext, useState, ReactNode } from "react";

const TokenContext = createContext<
  [string | null, (newToken: string | null) => void]
>([null, () => {}]);

export const TokenProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState(localStorage.getItem("token") || null);

  const wrappedSetToken = (newToken: string | null) => {
    if (newToken) {
      localStorage.setItem("token", newToken);
      setToken(newToken);
    } else {
      localStorage.removeItem("token");
      setToken(null);
    }
  };

  return (
    <TokenContext.Provider value={[token, wrappedSetToken]}>
      {children}
    </TokenContext.Provider>
  );
};

export default function useToken() {
  return useContext(TokenContext);
}

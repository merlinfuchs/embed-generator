import { useMemo } from "react";
import APIClient from "../api/client";
import useToken from "./useToken";

export default function useAPIClient() {
  const [token, setToken] = useToken();
  return useMemo(() => {
    if (token) {
      return new APIClient(token, setToken);
    } else {
      return null;
    }
  }, [token, setToken]);
}

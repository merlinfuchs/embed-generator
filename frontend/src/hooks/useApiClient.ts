import { useMemo } from "react";
import APIClient from "../api/client";
import useToken from "./useToken";

export default function useAPIClient() {
  const [token, setToken] = useToken();
  return useMemo(() => {
    return new APIClient(token, setToken);
  }, [token, setToken]);
}

import APIClient from "../api/client";
import { useToken } from "./useToken";

export default function useAPIClient() {
  const [token, setToken] = useToken();
  if (token && setToken) {
    return new APIClient(token, setToken);
  } else {
    return null;
  }
}

import { QueryCache, QueryClient } from "react-query";
import { useToasts } from "../util/toasts";
import { APIError } from "./queries";

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (err) => {
      if (err instanceof APIError) {
        if (err.status !== 401) {
          useToasts.getState().create({
            type: "error",
            title: `API Error (${err.status})`,
            message: err.message,
          });
        }
      } else {
        useToasts.getState().create({
          type: "error",
          title: "Unexpect API error",
          message: `${err}`,
        });
      }
    },
  }),
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (failureCount, err: any) => {
        if (failureCount >= 3) {
          return false;
        }
        return err.status >= 500;
      },
      staleTime: 1000 * 60 * 3,
    },
  },
});

export default queryClient;

// This is only used in Discord Activities to work around the lack of cookies
// We don't need to persist the token at all because we re-authenticate for every Activity session
let localSessionToken: string;

export function setLocalSessionToken(token: string) {
  localSessionToken = token;
}

export function fetchApi(
  input: RequestInfo,
  init?: RequestInit
): Promise<Response> {
  const headers = (init?.headers || {}) as Record<string, string>;
  if (localSessionToken) {
    headers.Authorization = localSessionToken;
  }

  return fetch(input, {
    ...init,
    headers,
  });
}

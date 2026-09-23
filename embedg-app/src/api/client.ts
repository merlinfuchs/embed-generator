import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { useToasts } from "../util/toasts";
import { APIError } from "./queries";

/**
 * Reports a request that never produced a response body: the network is down, or the server
 * answered with something that isn't JSON. Errors the API reports in a successful response are
 * handled by whoever made the request.
 */
function reportRequestError(err: unknown) {
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
      title: "Unexpected API error",
      message: `${err}`,
    });
  }
}

const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: reportRequestError }),
  // Without this a failed mutation only stopped the spinner: every call site passes onSuccess and
  // nothing at all for the rejected case.
  mutationCache: new MutationCache({ onError: reportRequestError }),
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

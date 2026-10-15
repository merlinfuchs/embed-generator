import { OpenPanel } from "@openpanel/web";
import { useEffect } from "react";
import { useUserQuery } from "../api/queries";

export const op = new OpenPanel({
  clientId: "73f81ab2-5b52-46d7-9735-b9041e96e01c",
  // Not "" or "/": the SDK falls back to its own API on "" and "/" + "/ops"
  // would be a protocol-relative URL.
  apiUrl: location.origin,
  trackScreenViews: true,
  trackOutgoingLinks: true,
});

// Block lists match OpenPanel's /track endpoint. Caddy maps /ops back to it.
// Keep in sync with embedg-site/src/analytics.ts.
const fetchApi = op.api.fetch.bind(op.api);
op.api.fetch = (path, data, options) =>
  fetchApi(path === "/track" ? "/ops" : path, data, options);

export default function AnalyticsProvider() {
  const { data } = useUserQuery();

  const user = data?.success ? data.data : null;

  useEffect(() => {
    if (user?.id) {
      op.identify({
        profileId: user.id,
        firstName: user.name,
      });
    }
  }, [user?.id, op.identify]);

  return null;
}

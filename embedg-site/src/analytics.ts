import ExecutionEnvironment from "@docusaurus/ExecutionEnvironment";

// Loaded lazily so the SDK, which pulls in rrweb, stays out of the main bundle.
if (ExecutionEnvironment.canUseDOM) {
  import("@openpanel/web").then(({ OpenPanel }) => {
    const op = new OpenPanel({
      clientId: "73f81ab2-5b52-46d7-9735-b9041e96e01c",
      // Not "" or "/": the SDK falls back to its own API on "" and "/" + "/ops"
      // would be a protocol-relative URL.
      apiUrl: location.origin,
      trackScreenViews: true,
      trackOutgoingLinks: true,
    });

    // Block lists match OpenPanel's /track endpoint. Caddy maps /ops back to it.
    // Keep in sync with embedg-app/src/util/analytics.ts.
    const fetchApi = op.api.fetch.bind(op.api);
    op.api.fetch = (path, data, options) =>
      fetchApi(path === "/track" ? "/ops" : path, data, options);
  });
}

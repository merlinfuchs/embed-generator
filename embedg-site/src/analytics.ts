import ExecutionEnvironment from "@docusaurus/ExecutionEnvironment";
import { OpenPanel } from "@openpanel/web";

if (ExecutionEnvironment.canUseDOM) {
  const op = new OpenPanel({
    clientId: "73f81ab2-5b52-46d7-9735-b9041e96e01c",
    apiUrl: "/relay",
    trackScreenViews: true,
    trackOutgoingLinks: true,
  });

  // Block lists match OpenPanel's /track endpoint. Caddy maps /relay/ops back to it.
  const fetchApi = op.api.fetch.bind(op.api);
  op.api.fetch = (path, data, options) =>
    fetchApi(path === "/track" ? "/ops" : path, data, options);
}

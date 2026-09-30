import { OpenPanel } from "@openpanel/web";
import { useEffect } from "react";
import { useUserQuery } from "../api/queries";

export const op = new OpenPanel({
  clientId: "73f81ab2-5b52-46d7-9735-b9041e96e01c",
  apiUrl: "https://analytics.xenon.bot/api",
  trackScreenViews: true,
  trackOutgoingLinks: true,
});

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

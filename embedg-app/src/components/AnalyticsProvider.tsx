import { OpenPanel } from "@openpanel/web";
import { useEffect } from "react";
import { useUserQuery } from "../api/queries";

export const op = new OpenPanel({
  clientId: "f4dd2f20-2d9f-4ff5-9486-6d88b5326fc7",
  apiUrl: "https://analytics.vaven.io/api",
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

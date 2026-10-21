import { useEffect } from "react";
import { useUserQuery } from "../api/queries";
import { op } from "../util/analytics";

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

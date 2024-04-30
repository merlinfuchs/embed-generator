import { useMemo } from "react";
import { useLocation } from "react-router-dom";

export default function LogoutLink(props: any) {
  const location = useLocation();

  const href = useMemo(
    () => `/api/auth/logout?redirect=${encodeURIComponent(location.pathname)}`,
    [location.pathname]
  );

  return <a href={href} {...props}></a>;
}

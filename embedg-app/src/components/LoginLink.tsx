import { type ComponentPropsWithoutRef, useMemo } from "react";
import { useLocation } from "react-router-dom";

interface Props extends ComponentPropsWithoutRef<"a"> {
  /** Also asks for the guilds.join scope. */
  joinSupportServer?: boolean;
}

export default function LoginLink({ joinSupportServer, ...props }: Props) {
  const location = useLocation();

  const href = useMemo(() => {
    const params = new URLSearchParams({ redirect: location.pathname });
    if (joinSupportServer) {
      params.set("join_support", "true");
    }
    return `/api/auth/login?${params}`;
  }, [location.pathname, joinSupportServer]);

  return <a href={href} {...props}></a>;
}

import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useToasts } from "../util/toasts";

const errorMessages: Record<string, string> = {
  access_denied: "You cancelled the login with Discord.",
  invalid_state:
    "The login attempt has expired or was started in a different browser.",
};

export default function LoginErrorHandler() {
  const [searchParams, setSearchParams] = useSearchParams();
  const createToast = useToasts((state) => state.create);

  const loginError = searchParams.get("login_error");

  useEffect(() => {
    if (!loginError) return;

    createToast({
      title: "Login failed",
      message:
        errorMessages[loginError] ||
        "Something went wrong while logging in with Discord.",
      type: "error",
    });

    const params = new URLSearchParams(searchParams);
    params.delete("login_error");
    setSearchParams(params, { replace: true });
  }, [loginError]);

  return null;
}

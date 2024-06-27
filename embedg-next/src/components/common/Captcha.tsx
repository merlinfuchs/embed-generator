import clientEnv from "@/lib/env/clientEnv";
import { useEffectOnce } from "@/lib/hooks/effectOnce";
import {
  FriendlyCaptchaSDK,
  WidgetErrorData,
  WidgetHandle,
} from "@friendlycaptcha/sdk/src/entry/sdk";
import { useTheme } from "next-themes";
import { forwardRef, useImperativeHandle, useRef } from "react";

export interface CaptchaProps {
  sitekey: string;
  onResponseChange?: (response: string | null) => void;
  onComplete?: (response: string) => void;
  onError?: (error: WidgetErrorData) => void;
  onExpire?: () => void;
  onReset?: () => void;
}

export interface CaptchaRef {
  reset(): void;
}

const Captcha = forwardRef<CaptchaRef, CaptchaProps>(
  (
    { sitekey, onResponseChange, onComplete, onError, onExpire, onReset },
    ref
  ) => {
    const widgetRef = useRef<WidgetHandle>();
    const elementRef = useRef<HTMLDivElement>(null);

    const { theme } = useTheme();

    useImperativeHandle(ref, () => ({
      reset() {
        widgetRef.current?.reset();
      },
    }));

    // TODO: useEffect with dependency on theme once FC is fixed
    useEffectOnce(() => {
      if (!elementRef.current) return;

      if (widgetRef.current) {
        widgetRef.current.destroy();
      }

      const sdk = new FriendlyCaptchaSDK();

      widgetRef.current = sdk.createWidget({
        element: elementRef.current!,
        sitekey: clientEnv.NEXT_PUBLIC_FRIENDLYCAPTCHA_SITEKEY,
        theme: theme === "dark" ? "dark" : theme === "light" ? "light" : "auto",
        startMode: "focus",
      });

      widgetRef.current.addEventListener(
        "frc:widget.complete",
        function (event) {
          if (onComplete) {
            onComplete(event.detail.response);
          }
          if (onResponseChange) {
            onResponseChange(event.detail.response);
          }
        }
      );

      widgetRef.current.addEventListener("frc:widget.error", function (event) {
        if (onError) {
          onError(event.detail.error);
        }
        if (onResponseChange) {
          onResponseChange(null);
        }
      });

      widgetRef.current.addEventListener("frc:widget.expire", function () {
        if (onExpire) {
          onExpire();
        }
        if (onResponseChange) {
          onResponseChange(null);
        }
      });

      widgetRef.current.addEventListener("frc:widget.reset", function () {
        if (onReset) {
          onReset();
        }
        if (onResponseChange) {
          onResponseChange(null);
        }
      });
    });

    return <div ref={elementRef} data-test="test" />;
  }
);

export default Captcha;

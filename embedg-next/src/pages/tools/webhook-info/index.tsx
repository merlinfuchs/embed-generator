import BaseInput from "@/components/common/BaseInput";
import Captcha, { CaptchaRef } from "@/components/common/Captcha";
import CaptchaWrapper from "@/components/common/CaptchaWrapper";
import ToolLayout from "@/components/common/ToolLayout";
import { Button } from "@/components/ui/button";
import clientEnv from "@/lib/env/clientEnv";
import { useRef, useState } from "react";

export default function WebhookInfoPage() {
  const captchaRef = useRef<CaptchaRef>(null);
  const [captchaResponse, setCaptchaResponse] = useState<string | null>(null);

  function getWebhookInfo() {
    if (!captchaResponse) return;

    console.log(captchaRef.current);
    if (captchaRef.current) {
      captchaRef.current.reset();
    }
  }

  return (
    <ToolLayout>
      <div className="my-10 max-w-3xl mx-auto">
        <div className="flex flex-col space-y-1.5 mb-6">
          <h1 className="text-2xl font-semibold leading-none tracking-tight">
            Webhook Info
          </h1>
          <p className="text-sm text-muted-foreground">
            Get information about a Discord or Guilded webhook.
          </p>
        </div>
        <form className="space-y-5">
          <BaseInput
            type="url"
            label="Webhook URL"
            value=""
            onChange={() => {}}
          />
          <div className="flex justify-between">
            <Captcha
              sitekey={clientEnv.NEXT_PUBLIC_FRIENDLYCAPTCHA_SITEKEY}
              onResponseChange={setCaptchaResponse}
              ref={captchaRef}
            />
            <Button
              disabled={!captchaResponse}
              type="button"
              onClick={getWebhookInfo}
            >
              Get Webhook Info
            </Button>
          </div>
        </form>
      </div>
    </ToolLayout>
  );
}

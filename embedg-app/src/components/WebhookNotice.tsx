import clsx from "clsx";
import type { ReactNode } from "react";

/** Why a message can't go to the webhook, next to wherever that shows. */
function WebhookNotice({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={clsx("text-orange-300 font-light", className)}>
      {children}
    </div>
  );
}

export function InteractiveWebhookNotice({
  className,
}: {
  className?: string;
}) {
  return (
    <WebhookNotice className={className}>
      Buttons with actions and select menus only work when the bot sends the
      message. Switch to Channel to send it, or turn them into link buttons.
    </WebhookNotice>
  );
}

export function FluxerComponentsNotice({ className }: { className?: string }) {
  return (
    <WebhookNotice className={className}>
      Fluxer doesn't support components yet. Remove them and switch to Embeds V1
      to send the message to Fluxer.
    </WebhookNotice>
  );
}

import clsx from "clsx";

/** Why a message can't go to a webhook, next to wherever that shows. */
export default function InteractiveWebhookNotice({
  className,
}: {
  className?: string;
}) {
  return (
    <div className={clsx("text-orange-300 font-light", className)}>
      Buttons with actions and select menus only work when the bot sends the
      message. Switch to Channel to send it, or turn them into link buttons.
    </div>
  );
}

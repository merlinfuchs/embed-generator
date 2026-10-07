import { useSendSettingsStore } from "../state/sendSettings";
import Notice from "./Notice";

/** Why a message can't go to the webhook, next to wherever that shows. */
export function InteractiveWebhookNotice({
  className,
}: {
  className?: string;
}) {
  const setMode = useSendSettingsStore((state) => state.setMode);

  return (
    <Notice
      tone="warning"
      className={className}
      action={
        <button
          type="button"
          className="flex-none self-end sm:self-auto border border-amber-400/40 hover:bg-amber-400/10 hover:border-amber-400/70 text-amber-300 font-medium px-3 py-1.5 rounded-lg transition-colors"
          onClick={() => setMode("channel")}
        >
          Switch to Channel
        </button>
      }
    >
      Buttons with actions and select menus only work when the bot sends the
      message. Send it from the Channel tab, or turn them into link buttons.
    </Notice>
  );
}

export function FluxerComponentsNotice({ className }: { className?: string }) {
  return (
    <Notice tone="warning" className={className}>
      Fluxer doesn't support components yet. Remove them and switch to Embeds V1
      to send the message to Fluxer.
    </Notice>
  );
}

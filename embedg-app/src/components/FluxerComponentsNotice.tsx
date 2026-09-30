import clsx from "clsx";

/** Why a message can't go to a Fluxer webhook, next to wherever that shows. */
export default function FluxerComponentsNotice({
  className,
}: {
  className?: string;
}) {
  return (
    <div className={clsx("text-orange-300 font-light", className)}>
      Fluxer doesn't support components yet. Remove them and switch to Embeds V1
      to send the message to Fluxer.
    </div>
  );
}

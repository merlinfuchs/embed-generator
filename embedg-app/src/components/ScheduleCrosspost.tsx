import { isAnnouncementChannel } from "../discord/util";
import CheckBox from "./CheckBox";

export default function ScheduleCrosspost({
  channelType,
  messageId,
  checked,
  onChange,
}: {
  channelType: number | undefined;
  messageId: string | null;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  // Edited messages stay published or not. Still shown while checked, so it can be turned off
  // after the channel stopped being an announcement channel.
  if (messageId !== null || (!checked && !isAnnouncementChannel(channelType))) {
    return null;
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <CheckBox label="Publish" checked={checked} onChange={onChange} />
        <div className="text-mist-300 text-sm">Publish</div>
      </div>
      <div className="mt-2 text-mist-400 text-sm font-light">
        Publishes every message to the servers following this announcement
        channel. Embed Generator needs the Manage Messages permission in the
        channel for it.
      </div>
    </div>
  );
}

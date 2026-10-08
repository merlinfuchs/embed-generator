import { PaperAirplaneIcon } from "@heroicons/react/20/solid";
import { useState } from "react";
import { useScheduledMessageTestMutation } from "../api/mutations";
import { useToasts } from "../util/toasts";
import ConfirmModal from "./ConfirmModal";
import Tooltip from "./Tooltip";

interface Props {
  guildId: string | null;
  channelId: string | null;
  threadName: string | null;
  savedMessageId: string | null;
}

// Sends the saved message to the channel once, the way the schedule will send it.
export default function ScheduleTestButton({
  guildId,
  channelId,
  threadName,
  savedMessageId,
}: Props) {
  const createToast = useToasts((s) => s.create);
  const testMutation = useScheduledMessageTestMutation();
  // It posts to a real channel, a click next to Cancel shouldn't do that right away.
  const [confirming, setConfirming] = useState(false);

  function ask() {
    if (!guildId || !channelId || !savedMessageId) {
      createToast({
        title: "Pick a saved message and a channel first",
        message: "A test sends the saved message to the channel once.",
        type: "error",
      });
      return;
    }
    setConfirming(true);
  }

  function test() {
    if (!guildId || !channelId || !savedMessageId) return;

    testMutation.mutate(
      {
        guildId,
        req: {
          channel_id: channelId,
          thread_name: threadName,
          saved_message_id: savedMessageId,
        },
      },
      {
        onSettled() {
          setConfirming(false);
        },
        onSuccess(res) {
          createToast(
            res.success
              ? {
                  title: "Test sent",
                  message: "The saved message went out to the channel once.",
                  type: "success",
                }
              : {
                  title: "The test couldn't be sent",
                  message: res.error.message,
                  type: "error",
                },
          );
        },
      },
    );
  }

  return (
    <>
      <button
        type="button"
        className="flex items-center text-mist-300 hover:text-white cursor-pointer md:bg-ink-900 md:rounded-lg md:px-2 md:py-1"
        onClick={ask}
      >
        <Tooltip text="Send the message to the channel once">
          <PaperAirplaneIcon className="h-5 w-5" />
        </Tooltip>
        <div className="hidden md:block ml-2">Send test</div>
      </button>
      {confirming && (
        <ConfirmModal
          title="Send the message to the channel now?"
          subTitle="It goes out once as a new message, the same way the schedule sends it. Its templates run, so they can change KV entries like counters."
          pending={testMutation.isPending}
          onClose={() => setConfirming(false)}
          onConfirm={test}
        />
      )}
    </>
  );
}

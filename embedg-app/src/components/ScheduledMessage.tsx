import type { ScheduledMessageWire } from "../api/wire";
import Tooltip from "./Tooltip";
import {
  ArrowRightIcon,
  CalendarDaysIcon,
  ClipboardIcon,
  ClockIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";
import { useEffect, useMemo, useRef, useState } from "react";
import { AutoAnimate } from "../util/autoAnimate";
import {
  useScheduledMessageDeleteMutation,
  useScheduledMessageUpdateMutation,
} from "../api/mutations";
import { useSendSettingsStore } from "../state/sendSettings";
import { useQueryClient } from "@tanstack/react-query";
import { useToasts } from "../util/toasts";
import EditorInput from "./EditorInput";
import { isThreadOnlyChannel, parseMessageId } from "../discord/util";
import ConfirmModal from "./ConfirmModal";
import SavedMessageSelect from "./SavedMessageSelect";
import { ChannelSelect } from "./ChannelSelect";
import clsx from "clsx";
import { usePremiumGuildFeatures } from "../util/premium";
import { formatDay, formatRun, timezoneOrUTC } from "../util/time";
import CheckBox from "./CheckBox";
import ScheduleEditor, {
  relativeRun,
  scheduleError,
  useSchedulePreview,
} from "./ScheduleEditor";
import {
  describeSchedule,
  isOnDates,
  scheduleDraftFromMessage,
  scheduleFromDraft,
} from "../util/schedule";
import { useGuildChannelsQuery } from "../api/queries";

export default function ScheduledMessage({
  msg,
  focusKey,
}: {
  msg: ScheduledMessageWire;
  // Changes when the message is picked elsewhere, like in the calendar, to open its form.
  focusKey?: number;
}) {
  const guildId = useSendSettingsStore((s) => s.guildId);
  const createToast = useToasts((s) => s.create);
  const { data: channels } = useGuildChannelsQuery(guildId);

  const features = usePremiumGuildFeatures(guildId);

  const [manage, setManage] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (focusKey === undefined) return;
    setManage(true);
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [focusKey]);

  const [enabled, setEnabled] = useState(msg.enabled);
  const [name, setName] = useState(msg.name);
  const storedTimezone = timezoneOrUTC(msg.cron_timezone);
  const [schedule, setSchedule] = useState(() => scheduleDraftFromMessage(msg));
  // Only asks the server while the form is open, not for every message in the list.
  const preview = useSchedulePreview(manage ? guildId : null, schedule);
  const [savedMessageId, setSavedMessageId] = useState<string | null>(
    msg.saved_message_id,
  );
  const [channelId, setChannelId] = useState<string | null>(msg.channel_id);
  const [threadName, setThreadName] = useState<string | null>(msg.thread_name);
  const [messageId, setMessageId] = useState<string | null>(msg.message_id);

  // Leaving manage mode without saving has to put every field back, the edits live in local state.
  function cancel() {
    setEnabled(msg.enabled);
    setName(msg.name);
    setSchedule(scheduleDraftFromMessage(msg));
    setSavedMessageId(msg.saved_message_id);
    setChannelId(msg.channel_id);
    setThreadName(msg.thread_name);
    setMessageId(msg.message_id);
    setManage(false);
  }

  // Both belong to the channel they were set for.
  function selectChannel(id: string | null) {
    setChannelId(id);
    setThreadName(null);
    setMessageId(null);
  }

  const selectedChannel = useMemo(
    () =>
      channels?.success ? channels.data.find((c) => c.id === channelId) : null,
    [channels, channelId],
  );

  const queryClient = useQueryClient();
  const updateMutation = useScheduledMessageUpdateMutation();

  function save() {
    if (name.length === 0 || !guildId || !channelId || !savedMessageId) {
      createToast({
        title: "Some required fields are missing",
        message:
          "Please fill all the required fields before updating the scheduled message",
        type: "error",
      });
      return;
    }

    const blocked = scheduleError(
      schedule,
      preview,
      !!features?.periodic_scheduled_messages,
    );
    if (blocked) {
      createToast({
        title: "The schedule can't be saved yet",
        message: blocked,
        type: "error",
      });
      return;
    }

    updateMutation.mutate(
      {
        guildId: guildId!,
        messageId: msg.id,
        req: {
          name,
          description: null,
          channel_id: channelId,
          message_id: messageId,
          thread_name: threadName,
          saved_message_id: savedMessageId,
          ...scheduleFromDraft(schedule),
          enabled: enabled,
        },
      },
      {
        onSuccess(res) {
          if (res.success) {
            // An end after a number of sends is an end date now, counting it again would move it.
            setSchedule(scheduleDraftFromMessage(res.data));
            setManage(false);
            queryClient.invalidateQueries({
              queryKey: ["scheduled-messages", guildId],
            });
          } else {
            createToast({
              title: "Failed to update scheduled message",
              message: res.error.message,
              type: "error",
            });
          }
        },
      },
    );
  }

  const deleteMutation = useScheduledMessageDeleteMutation();
  const [deleteModal, setDeleteModal] = useState(false);

  function deleteScheduledMessageConfirm() {
    deleteMutation.mutate(
      {
        messageId: msg.id,
        guildId: guildId!,
      },
      {
        onSuccess: (resp) => {
          if (resp.success) {
            queryClient.invalidateQueries({
              queryKey: ["scheduled-messages", guildId],
            });
          } else {
            createToast({
              title: "Failed to delete scheduled message",
              message: resp.error.message,
              type: "error",
            });
          }
        },
      },
    );
  }

  return (
    <div ref={ref}>
      <AutoAnimate
        className={clsx(
          "bg-ink-700 rounded-lg",
          !manage && msg.last_error && "ring-1 ring-red/70",
        )}
      >
        {manage ? (
          <div className="px-5 py-4" key="1">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-2 truncate text-lg mb-5">
                {schedule.onDates ? (
                  <CalendarDaysIcon className="text-mist-500 h-6 w-6" />
                ) : (
                  <ClockIcon className="text-mist-500 h-6 w-6" />
                )}
                <div className="text-white truncate">{msg.name}</div>
              </div>
              <div className="flex flex-none items-center space-x-4 md:space-x-3">
                <button
                  type="button"
                  className="flex items-center text-mist-300 hover:text-white cursor-pointer md:bg-ink-900 md:rounded-lg md:px-2 md:py-1"
                  onClick={cancel}
                >
                  <Tooltip text="Discard Changes">
                    <XMarkIcon className="h-5 w-5" />
                  </Tooltip>
                  <div className="hidden md:block ml-2">Cancel</div>
                </button>
                <button
                  type="button"
                  className="flex items-center text-white cursor-pointer bg-azure-500 hover:bg-azure-400 rounded-lg px-2 py-1"
                  onClick={save}
                >
                  <Tooltip text="Save Scheduled Message">
                    <ClipboardIcon className="h-5 w-5" />
                  </Tooltip>
                  <div className="ml-2">
                    Save <span className="hidden md:inline-block">Changes</span>
                  </div>
                </button>
              </div>
            </div>
            <div className="space-y-5">
              {msg.last_error && (
                <div className="border border-red/70 rounded-lg px-3 py-2">
                  <LastError msg={msg} />
                  <div className="text-mist-400 text-sm font-light mt-1">
                    Saving clears this error.
                  </div>
                </div>
              )}
              <div className="flex space-x-3">
                <EditorInput
                  label="Name"
                  type="text"
                  maxLength={32}
                  value={name}
                  onChange={setName}
                  className="flex-auto"
                />
                <div>
                  <div className="uppercase text-mist-300 text-sm font-medium mb-1.5">
                    Enabled
                  </div>
                  <CheckBox
                    label="Enabled"
                    checked={enabled}
                    onChange={setEnabled}
                    height={10}
                  />
                </div>
              </div>
              <div className="flex space-x-3 pb-3 items-end">
                <div className="flex-auto w-1/2">
                  <div className="mb-1.5 flex">
                    <div className="uppercase text-mist-300 text-sm font-medium">
                      Saved Message
                    </div>
                  </div>
                  <SavedMessageSelect
                    guildId={guildId}
                    messageId={savedMessageId}
                    onChange={setSavedMessageId}
                  />
                </div>
                <div className="flex-none pb-2">
                  <ArrowRightIcon className="h-5 w-5 text-mist-300" />
                </div>
                <div className="flex-auto w-1/2">
                  <div className="mb-1.5 flex">
                    <div className="uppercase text-mist-300 text-sm font-medium">
                      Channel
                    </div>
                  </div>
                  <ChannelSelect
                    guildId={guildId}
                    channelId={channelId}
                    onChange={selectChannel}
                  />
                </div>
              </div>
              {channelId && !isThreadOnlyChannel(selectedChannel?.type) && (
                <div>
                  <EditorInput
                    label="Message ID or URL"
                    type="text"
                    value={messageId ?? ""}
                    onChange={(v) => setMessageId(parseMessageId(v))}
                  />
                  <div className="mt-2 text-mist-400 text-sm font-light">
                    Leave empty to send a new message every time. Set it to a
                    message sent by Embed Generator to edit that message
                    instead, which keeps its username and avatar.
                  </div>
                </div>
              )}
              {isThreadOnlyChannel(selectedChannel?.type) && (
                <div>
                  <EditorInput
                    label="Thread Name"
                    type="text"
                    value={threadName ?? ""}
                    onChange={(v) => setThreadName(v || null)}
                  />
                  <div className="mt-2 text-mist-400 text-sm font-light">
                    When sending to a forum or media channel you have to set a
                    name for the thread that is being created.
                  </div>
                </div>
              )}
              <ScheduleEditor
                draft={schedule}
                onChange={setSchedule}
                preview={preview}
                periodicAllowed={!!features?.periodic_scheduled_messages}
              />
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-start py-4 px-5" key="2">
            <div className="flex-auto truncate">
              <div className="flex items-center space-x-2 truncate text-lg mb-1">
                <div className="text-white truncate flex space-x-2 items-center">
                  {isOnDates(msg) ? (
                    <CalendarDaysIcon className="text-mist-500 h-6 w-6" />
                  ) : (
                    <ClockIcon className="text-mist-500 h-6 w-6" />
                  )}
                  <div>{msg.name}</div>
                </div>
              </div>
              <div className="text-mist-400 text-sm font-light whitespace-normal">
                {isOnDates(msg)
                  ? describeDates(msg.run_times!, storedTimezone)
                  : describeSchedule(
                      msg.cron_expression,
                      msg.cron_interval,
                    )}{" "}
                ({storedTimezone})
              </div>
              <Status msg={msg} />
              <LastError msg={msg} />
            </div>
            <div className="flex flex-none items-center space-x-4 md:space-x-3">
              <button
                type="button"
                className="flex items-center text-mist-300 hover:text-white cursor-pointer md:bg-ink-900 md:rounded-lg md:px-2 md:py-1"
                onClick={() => setDeleteModal(true)}
              >
                <Tooltip text="Delete Scheduled Message">
                  <TrashIcon className="h-5 w-5" />
                </Tooltip>
                <div className="hidden md:block ml-2">Delete</div>
              </button>
              <button
                type="button"
                className="flex items-center text-mist-300 hover:text-white cursor-pointer md:bg-ink-900 md:rounded-lg md:px-2 md:py-1"
                onClick={() => setManage(true)}
              >
                <Tooltip text="Manage Scheduled message">
                  <PencilSquareIcon className="h-5 w-5" />
                </Tooltip>
                <div className="hidden md:block ml-2">Manage</div>
              </button>
            </div>
          </div>
        )}
      </AutoAnimate>
      {deleteModal && (
        <ConfirmModal
          title="Are you sure that you want to delete the scheduled message?"
          subTitle="The scheduled message will be deleted permanently and can't be restored."
          onClose={() => setDeleteModal(false)}
          pending={deleteMutation.isPending}
          onConfirm={deleteScheduledMessageConfirm}
        />
      )}
    </div>
  );
}

function LastError({ msg }: { msg: ScheduledMessageWire }) {
  if (!msg.last_error) return null;

  // A schedule that ran past its end date is off too, but the error didn't stop it.
  const label =
    msg.enabled || ended(msg)
      ? "Last run failed"
      : datesDone(msg)
        ? "Failed to send"
        : "Stopped";
  const at = msg.last_error_at
    ? ` on ${new Date(msg.last_error_at).toLocaleString()}`
    : "";

  return (
    <div className="text-red text-sm font-light whitespace-pre-line">
      {`${label}${at}: ${msg.last_error}`}
    </div>
  );
}

// The server keeps the dates sorted.
function describeDates(dates: string[], timezone: string): string {
  if (dates.length === 1) return formatRun(dates[0], timezone);
  return `${dates.length} dates from ${formatDay(dates[0], timezone)} to ${formatDay(dates[dates.length - 1], timezone)}`;
}

// Whether a message on dates is off because its last date ran, not because it was paused.
function datesDone(msg: ScheduledMessageWire): boolean {
  const last = msg.run_times?.at(-1);
  const ran = [msg.last_sent_at, msg.last_error_at].filter((t) => t !== null);
  return (
    !msg.enabled && !!last && ran.some((t) => Date.parse(t) >= Date.parse(last))
  );
}

function ended(msg: ScheduledMessageWire): boolean {
  return (
    msg.end_at !== null && Date.parse(msg.next_at) > Date.parse(msg.end_at)
  );
}

// What happens next, an error shows below it on its own.
function Status({ msg }: { msg: ScheduledMessageWire }) {
  if (msg.last_error && !msg.enabled && !ended(msg)) return null;

  let text: string;
  let className = "text-mist-500";
  if (ended(msg)) {
    text = `Ended ${new Date(msg.end_at!).toLocaleDateString()}`;
  } else if (msg.enabled) {
    text = `Next send ${new Date(msg.next_at).toLocaleString()}, ${relativeRun(msg.next_at)}`;
    className = "text-mist-300";
  } else if (datesDone(msg) && msg.last_sent_at) {
    text = `Sent ${new Date(msg.last_sent_at).toLocaleString()}`;
  } else {
    text = "Paused";
  }

  return (
    <div className={clsx("text-sm font-light whitespace-normal", className)}>
      {text}
    </div>
  );
}

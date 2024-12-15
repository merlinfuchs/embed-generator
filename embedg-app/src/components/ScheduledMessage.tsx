import { parseISO } from "date-fns";
import { ScheduledMessageWire } from "../api/wire";
import Tooltip from "./Tooltip";
import {
  ArrowRightIcon,
  CalendarDaysIcon,
  ClipboardIcon,
  ClockIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/20/solid";
import { useEffect, useMemo, useState } from "react";
import { AutoAnimate } from "../util/autoAnimate";
import {
  useScheduledMessageDeleteMutation,
  useScheduledMessageUpdateMutation,
} from "../api/mutations";
import { useSendSettingsStore } from "../state/sendSettings";
import { useQueryClient } from "react-query";
import { useToasts } from "../util/toasts";
import EditorInput from "./EditorInput";
import ConfirmModal from "./ConfirmModal";
import SavedMessageSelect from "./SavedMessageSelect";
import { ChannelSelect } from "./ChannelSelect";
import DateTimePicker from "./DateTimePicker";
import clsx from "clsx";
import cronstrue from "cronstrue";
import CronExpressionBuilder from "./CronExpressionBuilder";
import { usePremiumGuildFeatures } from "../util/premium";
import PremiumSuggest from "./PremiumSuggest";
import { getCurrentTimezone } from "../util/time";
import CheckBox from "./CheckBox";
import { useGuildChannelsQuery } from "../api/queries";

export default function ScheduledMessage({
  msg,
}: {
  msg: ScheduledMessageWire;
}) {
  const guildId = useSendSettingsStore((s) => s.guildId);
  const createToast = useToasts((s) => s.create);
  const { data: channels } = useGuildChannelsQuery(guildId);

  const features = usePremiumGuildFeatures(guildId);

  const [manage, setManage] = useState(false);

  const [enabled, setEnabled] = useState(msg.enabled);
  const [name, setName] = useState(msg.name);
  const [onlyOnce, setOnlyOnce] = useState(msg.only_once);
  const [startAt, setStartAt] = useState<string | undefined>(msg.start_at);
  const [endAt, setEndAt] = useState<string | undefined>(
    msg.end_at || undefined
  );
  const [cronExpression, setCronExpression] = useState(msg.cron_expression);
  const [savedMessageId, setSavedMessageId] = useState<string | null>(
    msg.saved_message_id
  );
  const [channelId, setChannelId] = useState<string | null>(msg.channel_id);
  const [threadName, setThreadName] = useState<string | null>(msg.thread_name);

  useEffect(() => {
    setThreadName(null);
  }, [channelId, setThreadName]);

  const selectedChannel = useMemo(
    () =>
      channels?.success ? channels.data.find((c) => c.id === channelId) : null,
    [channels, channelId]
  );

  const queryClient = useQueryClient();
  const updateMutation = useScheduledMessageUpdateMutation();

  function save() {
    if (
      name.length == 0 ||
      !guildId ||
      !channelId ||
      !savedMessageId ||
      !startAt
    ) {
      createToast({
        title: "Some required fields are missing",
        message:
          "Please fill all the required fields before updating the scheduled message",
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
          message_id: null,
          thread_name: threadName,
          saved_message_id: savedMessageId,
          cron_expression: cronExpression,
          cron_timezone: getCurrentTimezone(),
          start_at: startAt,
          end_at: endAt ?? null,
          only_once: onlyOnce,
          enabled: enabled,
        },
      },
      {
        onSuccess(res) {
          if (res.success) {
            setManage(false);
            queryClient.invalidateQueries(["scheduled-messages", guildId]);
          } else {
            createToast({
              title: "Failed to update scheduled message",
              message: res.error.message,
              type: "error",
            });
          }
        },
      }
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
            queryClient.invalidateQueries(["scheduled-messages", guildId]);
          } else {
            createToast({
              title: "Failed to delete scheduled message",
              message: resp.error.message,
              type: "error",
            });
          }
        },
      }
    );
  }

  return (
    <div>
      <AutoAnimate className="bg-dark-3 rounded">
        {manage ? (
          <div className="px-5 py-4" key="1">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-2 truncate text-lg mb-5">
                {onlyOnce ? (
                  <CalendarDaysIcon className="text-gray-500 h-6 w-6" />
                ) : (
                  <ClockIcon className="text-gray-500 h-6 w-6" />
                )}
                <div className="text-white truncate">{msg.name}</div>
              </div>
              <div
                className="flex items-center text-white cursor-pointer bg-blurple hover:bg-blurple-dark rounded px-2 py-1"
                role="button"
                onClick={save}
              >
                <Tooltip text="Save Scheduled Message">
                  <ClipboardIcon className="h-5 w-5" />
                </Tooltip>
                <div className="ml-2">
                  Save <span className="hidden md:inline-block">Changes</span>
                </div>
              </div>
            </div>
            <div className="space-y-5">
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
                  <div className="uppercase text-gray-300 text-sm font-medium mb-1.5">
                    Enabled
                  </div>
                  <CheckBox
                    checked={enabled}
                    onChange={setEnabled}
                    height={10}
                  />
                </div>
              </div>
              <div className="flex space-x-3 pb-3 items-end">
                <div className="flex-auto w-1/2">
                  <div className="mb-1.5 flex">
                    <div className="uppercase text-gray-300 text-sm font-medium">
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
                  <ArrowRightIcon className="h-5 w-5 text-gray-300" />
                </div>
                <div className="flex-auto w-1/2">
                  <div className="mb-1.5 flex">
                    <div className="uppercase text-gray-300 text-sm font-medium">
                      Channel
                    </div>
                  </div>
                  <ChannelSelect
                    guildId={guildId}
                    channelId={channelId}
                    onChange={setChannelId}
                  />
                </div>
              </div>
              {selectedChannel?.type === 15 && (
                <div>
                  <EditorInput
                    label="Thread Name"
                    type="text"
                    value={threadName ?? ""}
                    onChange={(v) => setThreadName(v || null)}
                  />
                  <div className="mt-2 text-gray-400 text-sm font-light">
                    When sending to a Forum Channel you have to set a name for
                    the thread that is being created.
                  </div>
                </div>
              )}
              <div className="flex">
                <button
                  className="flex bg-dark-2 p-1 rounded text-white"
                  onClick={() => setOnlyOnce((v) => !v)}
                >
                  <div
                    className={clsx(
                      "py-1 px-2 rounded transition-colors",
                      onlyOnce && "bg-dark-3"
                    )}
                  >
                    Send Once
                  </div>
                  <div
                    className={clsx(
                      "py-1 px-2 rounded transition-colors",
                      !onlyOnce && "bg-dark-3"
                    )}
                  >
                    Send Periodically
                  </div>
                </button>
              </div>
              {onlyOnce ? (
                <div>
                  <div>
                    <div className="mb-1.5 flex">
                      <div className="uppercase text-gray-300 text-sm font-medium">
                        Send at
                      </div>
                    </div>
                    <DateTimePicker
                      value={startAt}
                      onChange={setStartAt}
                      clearable={false}
                    />
                  </div>
                </div>
              ) : features?.periodic_scheduled_messages ? (
                <>
                  <div className="flex flex-col md:flex-row md:space-x-3 space-y-5 md:space-y-0">
                    <div className="flex-auto">
                      <div className="mb-1.5 flex">
                        <div className="uppercase text-gray-300 text-sm font-medium">
                          Start at
                        </div>
                      </div>
                      <DateTimePicker
                        value={startAt}
                        onChange={setStartAt}
                        clearable={false}
                      />
                    </div>
                    <div className="flex-auto">
                      <div className="mb-1.5 flex">
                        <div className="uppercase text-gray-300 text-sm font-medium">
                          End at
                        </div>
                      </div>
                      <DateTimePicker
                        value={endAt}
                        onChange={setEndAt}
                        clearable={true}
                      />
                    </div>
                  </div>
                  <div>
                    <CronExpressionBuilder
                      value={cronExpression}
                      onChange={setCronExpression}
                    />
                  </div>
                </>
              ) : (
                <PremiumSuggest />
              )}
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-start py-4 px-5" key="2">
            <div className="flex-auto truncate">
              <div className="flex items-center space-x-2 truncate text-lg mb-1">
                <div className="text-white truncate flex space-x-2 items-center">
                  {onlyOnce ? (
                    <CalendarDaysIcon className="text-gray-500 h-6 w-6" />
                  ) : (
                    <ClockIcon className="text-gray-500 h-6 w-6" />
                  )}
                  <div>{msg.name}</div>
                </div>
              </div>
              <div className="text-gray-400 text-sm font-light whitespace-normal">
                {!msg.only_once
                  ? cronToString(msg.cron_expression)
                  : formatDateTime(msg.start_at)}
              </div>
            </div>
            <div className="flex flex-none items-center space-x-4 md:space-x-3">
              <div
                className="flex items-center text-gray-300 hover:text-white cursor-pointer md:bg-dark-2 md:rounded md:px-2 md:py-1"
                role="button"
                onClick={() => setDeleteModal(true)}
              >
                <Tooltip text="Delete Scheduled Message">
                  <TrashIcon className="h-5 w-5" />
                </Tooltip>
                <div className="hidden md:block ml-2">Delete</div>
              </div>
              <div
                className="flex items-center text-gray-300 hover:text-white cursor-pointer md:bg-dark-2 md:rounded md:px-2 md:py-1"
                role="button"
                onClick={() => setManage(true)}
              >
                <Tooltip text="Manage Scheduled message">
                  <PencilSquareIcon className="h-5 w-5" />
                </Tooltip>
                <div className="hidden md:block ml-2">Manage</div>
              </div>
            </div>
          </div>
        )}
      </AutoAnimate>
      {deleteModal && (
        <ConfirmModal
          title="Are you sure that you want to delete the scheduled message?"
          subTitle="The scheduled message will be deleted permanently and can't be restored."
          onClose={() => setDeleteModal(false)}
          onConfirm={deleteScheduledMessageConfirm}
        />
      )}
    </div>
  );
}

function formatDateTime(v: string): string {
  return parseISO(v).toLocaleString();
}

function cronToString(v: string | null): string {
  if (!v) return "";
  try {
    return cronstrue.toString(v, { verbose: true });
  } catch {
    return "";
  }
}

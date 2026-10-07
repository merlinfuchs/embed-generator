import clsx from "clsx";
import { formatDistanceToNowStrict } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import type { ScheduledMessagePreviewRequestWire } from "../api/wire";
import { useScheduledMessagePreviewQuery } from "../api/queries";
import {
  defaultRepeat,
  describeSchedule,
  parseRepeat,
  type Repeat,
  type RepeatUnit,
  type ScheduleDraft,
  scheduleFromDraft,
  weekdayName,
  weekdayOrder,
} from "../util/schedule";
import { rezone, zonedDate, zonedDateTime } from "../util/time";
import DateTimePicker from "./DateTimePicker";
import PremiumSuggest from "./PremiumSuggest";
import TimezoneSelect from "./TimezoneSelect";

const previewRuns = 5;
const maxEvery = 1000;

const inputClass = "bg-ink-900 rounded-lg px-3 h-10 text-white";

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

export interface SchedulePreview {
  runs: string[];
  more: boolean;
  // Why the schedule can't be saved, like it never running before its end date.
  error: string | null;
  // The runs don't match the draft yet.
  checking: boolean;
}

// Asks the server when a repeating draft would send, as the user edits it.
export function useSchedulePreview(
  guildId: string | null,
  draft: ScheduleDraft,
): SchedulePreview {
  const req = useMemo<ScheduledMessagePreviewRequestWire | null>(
    () =>
      draft.onlyOnce || !draft.startAt
        ? null
        : {
            ...scheduleFromDraft(draft),
            limit: draft.ends === "count" ? draft.endCount : previewRuns,
          },
    [draft],
  );
  const debounced = useDebounced(req, 300);
  const query = useScheduledMessagePreviewQuery(guildId, debounced);

  const data = query.data;
  return {
    runs: data?.success ? data.data.runs : [],
    more: data?.success ? data.data.more : false,
    error: data && !data.success ? data.error.message : null,
    checking: req !== debounced || query.isFetching,
  };
}

// Why the schedule can't be saved as it is, null when it can.
export function scheduleBlocked(
  schedule: ScheduleDraft,
  preview: SchedulePreview,
): string | null {
  if (schedule.onlyOnce) return null;
  if (preview.error) return preview.error;
  if (
    schedule.ends === "count" &&
    (preview.checking || !lastRun(schedule, preview))
  ) {
    return "Wait until the upcoming sends are checked.";
  }
  return null;
}

export function lastRun(
  schedule: ScheduleDraft,
  preview: SchedulePreview,
): string | undefined {
  return schedule.ends === "count"
    ? preview.runs[schedule.endCount - 1]
    : undefined;
}

export function formatRun(iso: string, timezone: string): string {
  return new Date(iso).toLocaleString(undefined, {
    timeZone: timezone,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function relativeRun(iso: string): string {
  return formatDistanceToNowStrict(new Date(iso), { addSuffix: true });
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="uppercase text-mist-300 text-sm font-medium mb-1.5">
      {children}
    </div>
  );
}

interface Props {
  draft: ScheduleDraft;
  onChange: (draft: ScheduleDraft) => void;
  preview: SchedulePreview;
  periodicAllowed: boolean;
}

export default function ScheduleEditor({
  draft,
  onChange,
  preview,
  periodicAllowed,
}: Props) {
  const set = (patch: Partial<ScheduleDraft>) =>
    onChange({ ...draft, ...patch });

  // The picked times were meant in the new timezone, so keep their wall clock.
  function changeTimezone(tz: string) {
    set({
      timezone: tz,
      startAt: draft.startAt && rezone(draft.startAt, draft.timezone, tz),
      endAt: draft.endAt && rezone(draft.endAt, draft.timezone, tz),
    });
  }

  return (
    <div className="bg-ink-800 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="uppercase text-mist-300 text-sm font-medium">When</div>
        <div className="flex bg-ink-900 p-1 rounded-lg text-white">
          {[true, false].map((once) => (
            <button
              key={String(once)}
              type="button"
              onClick={() =>
                set({
                  onlyOnce: once,
                  // A repeating schedule can start right away, a single send needs a time picked.
                  startAt: once ? undefined : new Date().toISOString(),
                })
              }
              className={clsx(
                "py-1 px-2 rounded-lg transition-colors",
                draft.onlyOnce === once && "bg-ink-700",
              )}
            >
              {once ? "Send once" : "Repeat"}
            </button>
          ))}
        </div>
      </div>

      {draft.onlyOnce ? (
        <div className="space-y-4">
          <div>
            <Label>Send at</Label>
            <DateTimePicker
              value={draft.startAt}
              onChange={(v) => set({ startAt: v })}
              clearable={false}
              timezone={draft.timezone}
            />
            {draft.startAt && (
              <div className="mt-2 text-mist-400 text-sm font-light">
                Sends {relativeRun(draft.startAt)}
              </div>
            )}
          </div>
          <div>
            <Label>Timezone</Label>
            <TimezoneSelect value={draft.timezone} onChange={changeTimezone} />
          </div>
        </div>
      ) : !periodicAllowed ? (
        <PremiumSuggest />
      ) : (
        <div className="grid md:grid-cols-[1fr_16rem] gap-5">
          <div className="space-y-4 min-w-0">
            {draft.repeat ? (
              <RepeatFields
                repeat={draft.repeat}
                onChange={(repeat) => set({ repeat })}
              />
            ) : (
              <div>
                <Label>Cron expression</Label>
                <input
                  type="text"
                  aria-label="Cron expression"
                  className={clsx(inputClass, "w-full font-mono")}
                  value={draft.cron}
                  onChange={(e) => set({ cron: e.target.value })}
                />
                <div className="mt-2 text-mist-400 text-sm font-light">
                  {describeSchedule(draft.cron, draft.interval)}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 flex-wrap text-mist-300">
              Starting
              <input
                type="date"
                aria-label="Starting"
                className={inputClass}
                value={
                  draft.startAt ? zonedDate(draft.startAt, draft.timezone) : ""
                }
                onChange={(e) => {
                  if (!e.target.value) return;
                  // Counting starts at the first run after this, a day already begun starts now.
                  const start = zonedDateTime(
                    e.target.value,
                    draft.timezone,
                    0,
                    0,
                  );
                  const now = new Date().toISOString();
                  set({ startAt: start < now ? now : start });
                }}
              />
            </div>

            <div>
              <Label>Timezone</Label>
              <TimezoneSelect
                value={draft.timezone}
                onChange={changeTimezone}
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap text-mist-300">
              Ends
              <select
                aria-label="Ends"
                className={clsx(inputClass, "cursor-pointer")}
                value={draft.ends}
                onChange={(e) =>
                  set({ ends: e.target.value as ScheduleDraft["ends"] })
                }
              >
                <option value="never">never</option>
                <option value="date">on a date</option>
                <option value="count">after a number of sends</option>
              </select>
              {draft.ends === "date" && (
                <input
                  type="date"
                  aria-label="End date"
                  className={inputClass}
                  value={
                    draft.endAt ? zonedDate(draft.endAt, draft.timezone) : ""
                  }
                  onChange={(e) =>
                    e.target.value &&
                    set({
                      endAt: zonedDateTime(
                        e.target.value,
                        draft.timezone,
                        23,
                        59,
                        59,
                      ),
                    })
                  }
                />
              )}
              {draft.ends === "count" && (
                <>
                  <input
                    type="number"
                    aria-label="Number of sends"
                    min={1}
                    max={maxEvery}
                    className={clsx(inputClass, "w-24")}
                    value={draft.endCount}
                    onChange={(e) =>
                      set({ endCount: clampInt(e.target.value, 1, maxEvery) })
                    }
                  />
                  sends
                </>
              )}
            </div>

            <button
              type="button"
              className="text-sm text-mist-400 hover:text-mist-300"
              onClick={() =>
                draft.repeat
                  ? set({
                      repeat: null,
                      cron: scheduleFromDraft(draft).cron_expression ?? "",
                      interval: 1,
                    })
                  : set({
                      repeat:
                        parseRepeat(draft.cron, draft.interval) ??
                        defaultRepeat,
                    })
              }
            >
              {draft.repeat
                ? "Advanced: use a cron expression"
                : "Use the simple editor"}
            </button>
          </div>

          <PreviewPanel draft={draft} preview={preview} />
        </div>
      )}
    </div>
  );
}

function clampInt(value: string, min: number, max: number): number {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

const units: RepeatUnit[] = ["minutes", "hours", "days", "weeks", "months"];

function RepeatFields({
  repeat,
  onChange,
}: {
  repeat: Repeat;
  onChange: (r: Repeat) => void;
}) {
  const set = (patch: Partial<Repeat>) => onChange({ ...repeat, ...patch });
  const time = `${String(repeat.hour).padStart(2, "0")}:${String(repeat.minute).padStart(2, "0")}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap text-mist-300">
        Every
        <input
          type="number"
          aria-label="Every"
          min={1}
          max={maxEvery}
          className={clsx(inputClass, "w-20")}
          value={repeat.every}
          onChange={(e) =>
            set({ every: clampInt(e.target.value, 1, maxEvery) })
          }
        />
        <select
          aria-label="Unit"
          className={clsx(inputClass, "cursor-pointer")}
          value={repeat.unit}
          onChange={(e) => set({ unit: e.target.value as RepeatUnit })}
        >
          {units.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
        {repeat.unit === "hours" && (
          <>
            at minute
            <input
              type="number"
              aria-label="Minute"
              min={0}
              max={59}
              className={clsx(inputClass, "w-20")}
              value={repeat.minute}
              onChange={(e) => set({ minute: clampInt(e.target.value, 0, 59) })}
            />
          </>
        )}
        {repeat.unit !== "minutes" && repeat.unit !== "hours" && (
          <>
            at
            <input
              type="time"
              aria-label="Time"
              className={inputClass}
              value={time}
              onChange={(e) => {
                const [hour, minute] = e.target.value.split(":").map(Number);
                if (Number.isFinite(hour) && Number.isFinite(minute)) {
                  set({ hour, minute });
                }
              }}
            />
          </>
        )}
      </div>

      {repeat.unit === "weeks" && (
        <div className="flex items-center gap-1.5 flex-wrap text-mist-300">
          <span className="mr-1">on</span>
          {weekdayOrder.map((day) => {
            const on = repeat.weekdays.includes(day);
            return (
              <button
                key={day}
                type="button"
                aria-pressed={on}
                className={clsx(
                  "h-9 min-w-9 px-2 rounded-full text-sm",
                  on ? "bg-azure-500 text-white" : "bg-ink-900 text-mist-300",
                )}
                onClick={() =>
                  set({
                    weekdays: on
                      ? repeat.weekdays.filter((d) => d !== day)
                      : [...repeat.weekdays, day],
                  })
                }
              >
                {weekdayName(day)}
              </button>
            );
          })}
        </div>
      )}

      {repeat.unit === "months" && (
        <div className="flex items-center gap-2 text-mist-300">
          on day
          <input
            type="number"
            aria-label="Day of the month"
            min={1}
            max={31}
            className={clsx(inputClass, "w-20")}
            value={repeat.monthDay}
            onChange={(e) => set({ monthDay: clampInt(e.target.value, 1, 31) })}
          />
        </div>
      )}
    </div>
  );
}

function PreviewPanel({
  draft,
  preview,
}: {
  draft: ScheduleDraft;
  preview: SchedulePreview;
}) {
  const { runs, more, error, checking } = preview;
  const shown = runs.slice(0, previewRuns);
  const hidden = runs.length - shown.length;

  return (
    <div
      className={clsx(
        "bg-ink-900 rounded-lg p-4 self-start transition-opacity",
        checking && "opacity-60",
      )}
    >
      <div className="uppercase text-mist-300 text-sm font-medium mb-2">
        Upcoming sends
      </div>
      {error ? (
        <div className="text-sm text-amber-300">{error}</div>
      ) : (
        <>
          {draft.repeat && (
            <div className="text-sm text-mist-300 mb-3">
              {describeSchedule(
                scheduleFromDraft(draft).cron_expression,
                draft.repeat.every,
              )}
            </div>
          )}
          <ol className="space-y-2 text-sm">
            {shown.map((run, i) => (
              <li key={run} className="flex justify-between gap-3">
                <span className={i === 0 ? "text-white" : "text-mist-400"}>
                  {formatRun(run, draft.timezone)}
                </span>
                <span className="text-mist-500 text-xs pt-0.5 shrink-0">
                  {relativeRun(run)}
                </span>
              </li>
            ))}
          </ol>
          {runs.length > 0 && (
            <div className="text-mist-500 text-xs mt-2">
              {hidden > 0
                ? `${hidden} more, the last ${formatRun(runs[runs.length - 1], draft.timezone)}`
                : more && draft.ends !== "count"
                  ? "and so on"
                  : "then it ends"}
            </div>
          )}
          {runs.length === 0 && checking && (
            <div className="text-mist-500 text-sm">Checking…</div>
          )}
        </>
      )}
    </div>
  );
}

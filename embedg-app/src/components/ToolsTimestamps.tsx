import { ClipboardDocumentIcon } from "@heroicons/react/24/outline";
import { CheckIcon } from "@heroicons/react/20/solid";
import { useEffect, useState } from "react";
import {
  formatTimestamp,
  timestampFormats,
  timestampMarkdown,
  unixSeconds,
} from "../util/timestamp";
import {
  getCurrentTimezone,
  rezone,
  zonedDate,
  zonedDateTime,
  zonedTime,
} from "../util/time";
import TimezoneSelect from "./TimezoneSelect";

function currentSecond(): string {
  const now = new Date();
  now.setMilliseconds(0);
  return now.toISOString();
}

// HH:MM:SS of the instant's wall clock in the timezone.
function zonedTimeWithSeconds(iso: string, timezone: string): string {
  const seconds = String(new Date(iso).getUTCSeconds()).padStart(2, "0");
  return `${zonedTime(iso, timezone)}:${seconds}`;
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    });
  }

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={copy}
      className="flex items-center rounded-lg bg-ink-900 hover:bg-ink-600 text-mist-100 overflow-hidden text-left cursor-pointer max-w-full"
    >
      <span className="bg-azure-500 hover:bg-azure-400 self-stretch flex items-center px-2.5 flex-none">
        {copied ? (
          <CheckIcon className="h-4 w-4" />
        ) : (
          <ClipboardDocumentIcon className="h-4 w-4" />
        )}
      </span>
      <code className="px-3 py-1.5 text-sm font-mono truncate">{text}</code>
    </button>
  );
}

export default function ToolsTimestamps() {
  const [timezone, setTimezone] = useState(getCurrentTimezone);
  const [instant, setInstant] = useState(currentSecond);
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));

  // The relative time keeps counting.
  useEffect(() => {
    const interval = setInterval(
      () => setNow(Math.floor(Date.now() / 1000)),
      1000,
    );
    return () => clearInterval(interval);
  }, []);

  const unix = unixSeconds(instant);

  function setDate(date: string) {
    if (!date) return;
    const [h, m] = zonedTime(instant, timezone).split(":").map(Number);
    const s = new Date(instant).getUTCSeconds();
    setInstant(zonedDateTime(date, timezone, h, m, s));
  }

  function setTime(time: string) {
    const [h, m, s = 0] = time.split(":").map(Number);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return;
    setInstant(zonedDateTime(zonedDate(instant, timezone), timezone, h, m, s));
  }

  function setUnix(value: string) {
    const n = Number(value);
    if (!value.trim() || !Number.isFinite(n)) return;
    const date = new Date(Math.trunc(n) * 1000);
    if (Number.isNaN(date.getTime())) return;
    setInstant(date.toISOString());
  }

  // The picked wall clock stays, like in the schedule editor.
  function changeTimezone(tz: string) {
    setInstant(rezone(instant, timezone, tz));
    setTimezone(tz);
  }

  const inputClass =
    "bg-ink-900 rounded-lg px-3 h-10 w-full focus:outline-none text-mist-100 scheme-dark";

  return (
    <div className="space-y-8">
      <div className="bg-ink-700 rounded-xl p-5 space-y-5">
        <div className="grid gap-5 md:grid-cols-3">
          <label className="block">
            <div className="text-mist-300 text-sm mb-2">Date</div>
            <input
              type="date"
              className={inputClass}
              value={zonedDate(instant, timezone)}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <label className="block">
            <div className="text-mist-300 text-sm mb-2">Time</div>
            <input
              type="time"
              step={1}
              className={inputClass}
              value={zonedTimeWithSeconds(instant, timezone)}
              onChange={(e) => setTime(e.target.value)}
            />
          </label>
          <div>
            <div className="text-mist-300 text-sm mb-2">Timezone</div>
            <TimezoneSelect value={timezone} onChange={changeTimezone} />
          </div>
        </div>
        <div className="flex flex-col md:flex-row md:items-end gap-5">
          <label className="block md:w-64">
            <div className="text-mist-300 text-sm mb-2">Unix timestamp</div>
            <input
              key={unix}
              type="text"
              inputMode="numeric"
              className={inputClass}
              defaultValue={unix}
              onChange={(e) => setUnix(e.target.value)}
            />
          </label>
          <button
            type="button"
            className="px-3 h-10 rounded-lg border-2 border-white/15 text-mist-100 hover:bg-white/5 hover:border-white/30 transition-colors cursor-pointer flex-none"
            onClick={() => setInstant(currentSecond())}
          >
            Set to now
          </button>
        </div>
      </div>

      <div className="bg-ink-700 rounded-xl p-5">
        <div className="grid grid-cols-[1fr_auto] md:grid-cols-[1.2fr_1fr_1fr] gap-x-5 text-mist-400 text-sm font-medium pb-3 border-b border-white/10">
          <div className="hidden md:block">Format</div>
          <div className="hidden md:block">Example result</div>
          <div className="hidden md:block">Chat syntax</div>
        </div>
        {timestampFormats.flatMap(({ group, formats }) =>
          formats.map(({ style, name }) => {
            const markdown = timestampMarkdown(unix, style);
            return (
              <div
                key={style}
                className="grid md:grid-cols-[1.2fr_1fr_1fr] gap-x-5 gap-y-2 items-center py-3 border-b border-white/5 last:border-b-0"
              >
                <div>
                  <div className="text-mist-100 text-sm">{name}</div>
                  <div className="text-mist-500 text-xs">{group}</div>
                </div>
                <div className="text-mist-100">
                  {formatTimestamp(unix, style, now)}
                </div>
                <div className="flex">
                  <CopyButton text={markdown} label={`Copy ${name}`} />
                </div>
              </div>
            );
          }),
        )}
        <div className="grid md:grid-cols-[1.2fr_1fr_1fr] gap-x-5 gap-y-2 items-center pt-3">
          <div>
            <div className="text-mist-100 text-sm">Unix timestamp</div>
            <div className="text-mist-500 text-xs">Seconds since 1970</div>
          </div>
          <div className="text-mist-100">{unix}</div>
          <div className="flex">
            <CopyButton text={String(unix)} label="Copy Unix timestamp" />
          </div>
        </div>
      </div>
      <div className="text-mist-400 text-sm font-light">
        The examples use your browser's timezone and language. In Discord,
        everyone sees the timestamp in their own.
      </div>
    </div>
  );
}

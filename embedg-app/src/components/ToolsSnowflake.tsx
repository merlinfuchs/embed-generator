import { CheckIcon } from "@heroicons/react/20/solid";
import { ClipboardDocumentIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import {
  decodeSnowflake,
  formatAge,
  parseSnowflake,
  snowflakeBits,
  snowflakeFromTime,
} from "../util/snowflake";

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

function Row({
  name,
  hint,
  children,
}: {
  name: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid md:grid-cols-[1fr_2fr] gap-x-5 gap-y-2 items-center py-3 border-b border-white/5 last:border-b-0">
      <div>
        <div className="text-mist-100 text-sm">{name}</div>
        {hint && <div className="text-mist-500 text-xs">{hint}</div>}
      </div>
      <div className="text-mist-100 break-words min-w-0">{children}</div>
    </div>
  );
}

const inputClass =
  "bg-ink-900 rounded-lg px-3 h-10 w-full focus:outline-none text-mist-100 placeholder:font-light placeholder-mist-500 scheme-dark";

// A datetime-local value, in the browser's timezone, down to the second.
function toLocalInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function IdToDate() {
  const [input, setInput] = useState("");

  const id = parseSnowflake(input);
  const parts = id === undefined ? undefined : decodeSnowflake(id);
  const date = parts && new Date(parts.timestamp);
  const unix = parts && Math.floor(parts.timestamp / 1000);

  return (
    <div className="bg-ink-700 rounded-xl p-5 space-y-5">
      <label className="block">
        <div className="text-mist-300 text-sm mb-2">Discord ID</div>
        <input
          type="text"
          inputMode="numeric"
          className={inputClass}
          placeholder="175928847299117063"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <div className="text-mist-500 text-xs mt-2">
          Works for any ID: users, servers, channels, roles, messages and more.
          Mentions and Discord links work too.
        </div>
      </label>

      {input.trim() && !parts && (
        <div className="text-red">
          That's not a Discord ID. IDs are numbers of up to 20 digits.
        </div>
      )}

      {id !== undefined && parts && date && unix !== undefined && (
        <div>
          <Row name="Created" hint="In your timezone">
            {new Intl.DateTimeFormat(undefined, {
              dateStyle: "full",
              timeStyle: "long",
            }).format(date)}
            <div className="text-mist-400 text-sm">
              {formatAge(parts.timestamp, Date.now())}
            </div>
          </Row>
          <Row name="Created (UTC)">
            <CopyButton text={date.toISOString()} label="Copy UTC date" />
          </Row>
          <Row name="Unix timestamp" hint="Seconds since 1970">
            <CopyButton text={String(unix)} label="Copy Unix timestamp" />
          </Row>
          <Row name="Discord timestamp" hint="Paste it into a message">
            <CopyButton text={`<t:${unix}:F>`} label="Copy Discord timestamp" />
          </Row>
          <Row name="Worker ID">{parts.worker}</Row>
          <Row name="Process ID">{parts.process}</Row>
          <Row name="Increment" hint="Counts IDs made in the same millisecond">
            {parts.increment}
          </Row>
          <Row name="Binary" hint="Time, worker, process, increment">
            <div className="font-mono text-xs flex flex-wrap gap-x-2 gap-y-1">
              {snowflakeBits(id).map((bits, i) => (
                <span
                  // The four groups never change order.
                  // biome-ignore lint/suspicious/noArrayIndexKey: fixed groups
                  key={i}
                  className={
                    [
                      "text-azure-400",
                      "text-mist-100",
                      "text-mist-300",
                      "text-mist-400",
                    ][i]
                  }
                >
                  {bits}
                </span>
              ))}
            </div>
          </Row>
        </div>
      )}
    </div>
  );
}

function DateToId() {
  const [value, setValue] = useState(() => toLocalInput(new Date()));

  const ms = value ? new Date(value).getTime() : Number.NaN;
  const id = snowflakeFromTime(ms);

  return (
    <div className="bg-ink-700 rounded-xl p-5 space-y-5">
      <label className="block md:max-w-sm">
        <div className="text-mist-300 text-sm mb-2">
          Date and time, in your timezone
        </div>
        <input
          type="datetime-local"
          step={1}
          min="2015-01-01T00:00:00"
          className={inputClass}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </label>

      {id === undefined ? (
        <div className="text-red">
          Pick a date from 1 January 2015 on, that's when Discord's IDs start.
        </div>
      ) : (
        <Row
          name="First ID at that time"
          hint="Use it as before or after in the API"
        >
          <CopyButton text={id.toString()} label="Copy ID" />
        </Row>
      )}
    </div>
  );
}

export default function ToolsSnowflake() {
  return (
    <div className="space-y-12">
      <section>
        <h2 className="text-white font-medium mb-4 text-xl">ID to date</h2>
        <IdToDate />
      </section>
      <section>
        <h2 className="text-white font-medium mb-4 text-xl">ID from a date</h2>
        <DateToId />
      </section>
    </div>
  );
}

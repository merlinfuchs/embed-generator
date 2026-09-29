import clsx from "clsx";
import { useState } from "react";
import { useGuildChannelsQuery, useGuildRolesQuery } from "../api/queries";
import type { AssistantFieldWire } from "../api/wire";
import { composeFieldAnswers } from "../util/assistant";
import { ChannelSelect } from "./ChannelSelect";
import { RoleSelect } from "./RoleSelect";

/**
 * Lets the user fill in what the assistant asked for, like a channel, instead
 * of writing it out.
 */
export default function AssistantFieldsCard({
  guildId,
  fields,
  onSend,
}: {
  guildId: string;
  fields: AssistantFieldWire[];
  onSend: (content: string) => void;
}) {
  const [values, setValues] = useState(() => fields.map(getDefault));
  const answers = composeFieldAnswers(fields, values);

  return (
    <div className="rounded-lg border border-white/10 bg-ink-700 p-3 space-y-3">
      {fields.map((field, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: fields don't change
        <div key={i} className="space-y-1">
          <div className="text-xs font-medium uppercase text-mist-300">
            {field.label}
          </div>
          <FieldInput
            field={field}
            guildId={guildId}
            value={values[i]}
            onChange={(value) =>
              setValues((v) => v.map((old, j) => (j === i ? value : old)))
            }
          />
          {field.description && (
            <div className="text-xs text-mist-400">{field.description}</div>
          )}
        </div>
      ))}

      <button
        type="button"
        disabled={!answers}
        className={clsx(
          "px-3 py-1.5 rounded-lg text-sm text-white",
          answers
            ? "bg-azure-500 hover:bg-azure-400"
            : "bg-ink-600 cursor-not-allowed",
        )}
        onClick={() => onSend(answers)}
      >
        Send
      </button>
    </div>
  );
}

// Only defaults the input can show are used, so nothing hidden is sent.
function getDefault(field: AssistantFieldWire) {
  switch (field.type) {
    case "channel":
    case "role":
      return "";
    case "choice":
      return field.options.includes(field.default) ? field.default : "";
    default:
      return field.default;
  }
}

function FieldInput({
  field,
  guildId,
  value,
  onChange,
}: {
  field: AssistantFieldWire;
  guildId: string;
  value: string;
  onChange: (value: string) => void;
}) {
  switch (field.type) {
    case "channel":
      return <ChannelFieldInput guildId={guildId} onChange={onChange} />;
    case "role":
      return <RoleFieldInput guildId={guildId} onChange={onChange} />;
    case "choice":
      return (
        <div className="flex flex-wrap gap-2">
          {field.options.map((option) => (
            <button
              type="button"
              key={option}
              className={clsx(
                "px-3 py-1 rounded-lg text-sm",
                option === value
                  ? "bg-azure-500 text-white"
                  : "bg-ink-900 text-mist-300 hover:text-mist-100",
              )}
              onClick={() => onChange(option)}
            >
              {option}
            </button>
          ))}
        </div>
      );
    default:
      return (
        <input
          type="text"
          className="bg-ink-900 px-3 h-10 rounded-lg w-full text-white focus:outline-none"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={500}
        />
      );
  }
}

// The values are the name and ID, so the assistant can use the ID and the
// user sees what they picked.
function ChannelFieldInput({
  guildId,
  onChange,
}: {
  guildId: string;
  onChange: (value: string) => void;
}) {
  const [channelId, setChannelId] = useState<string | null>(null);
  const { data: channels } = useGuildChannelsQuery(guildId);

  return (
    <ChannelSelect
      guildId={guildId}
      channelId={channelId}
      onChange={(id) => {
        setChannelId(id);
        const channel =
          channels?.success && channels.data.find((c) => c.id === id);
        onChange(channel ? `#${channel.name} (channel ID ${channel.id})` : "");
      }}
    />
  );
}

function RoleFieldInput({
  guildId,
  onChange,
}: {
  guildId: string;
  onChange: (value: string) => void;
}) {
  const [roleId, setRoleId] = useState<string | null>(null);
  const { data: roles } = useGuildRolesQuery(guildId);

  return (
    <RoleSelect
      guildId={guildId}
      roleId={roleId}
      onChange={(id) => {
        setRoleId(id);
        const role = roles?.success && roles.data.find((r) => r.id === id);
        onChange(role ? `@${role.name} (role ID ${role.id})` : "");
      }}
    />
  );
}

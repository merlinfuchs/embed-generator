import { CheckIcon } from "@heroicons/react/20/solid";
import {
  ArrowTopRightOnSquareIcon,
  ClipboardDocumentIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { type FormEvent, useState } from "react";
import { useUserLookupQuery, useUserQuery } from "../api/queries";
import type { UserLookupWire } from "../api/wire";
import {
  userAvatarUrl,
  userBannerUrl,
  userCustomAvatarUrl,
} from "../discord/cdn";
import {
  accentColorHex,
  formatAge,
  parseUserId,
  snowflakeDate,
  userBadgeNames,
} from "../util/discordUser";
import LoginLink from "./LoginLink";

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

function Row({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div className="grid md:grid-cols-[1fr_2fr] gap-x-5 gap-y-2 items-center py-3 border-b border-white/5 last:border-b-0">
      <div className="text-mist-100 text-sm">{name}</div>
      <div className="text-mist-100 break-words min-w-0">{children}</div>
    </div>
  );
}

function ImageLinks({ url, name }: { url: string; name: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="flex items-center space-x-2 rounded-lg bg-ink-900 hover:bg-ink-600 px-3 py-1.5 text-sm"
      >
        <ArrowTopRightOnSquareIcon className="h-4 w-4" />
        <span>Open {name}</span>
      </a>
      <CopyButton text={url} label={`Copy ${name} URL`} />
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md bg-ink-900 px-2 py-0.5 text-xs text-mist-200">
      {children}
    </span>
  );
}

function UserCard({ user }: { user: UserLookupWire }) {
  const created = snowflakeDate(user.id);
  const badges = userBadgeNames(user.public_flags);
  const banner = userBannerUrl(user);
  const avatar = userCustomAvatarUrl(user);
  const accent =
    user.accent_color === null ? null : accentColorHex(user.accent_color);
  const displayName = user.global_name ?? user.username;
  const handle =
    user.discriminator && user.discriminator !== "0"
      ? `${user.username}#${user.discriminator}`
      : `@${user.username}`;

  return (
    <div className="bg-ink-700 rounded-xl overflow-hidden">
      {banner ? (
        <img src={banner} alt="" className="h-32 md:h-44 w-full object-cover" />
      ) : (
        <div
          className="h-32 md:h-44 w-full bg-ink-900"
          style={accent ? { backgroundColor: accent } : undefined}
        />
      )}
      <div className="px-5 pb-5">
        <div className="flex items-end space-x-4 -mt-12">
          <img
            src={userAvatarUrl(user, 256)}
            alt=""
            className="h-24 w-24 flex-none rounded-full border-4 border-ink-700 bg-ink-900"
          />
          <div className="min-w-0 pb-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-xl font-medium text-mist-100 break-words">
                {displayName}
              </div>
              {user.bot && <Tag>Bot</Tag>}
              {user.system && <Tag>System</Tag>}
            </div>
            <div className="text-mist-400 font-light break-words">{handle}</div>
          </div>
        </div>

        {badges.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-5">
            {badges.map((b) => (
              <Tag key={b}>{b}</Tag>
            ))}
          </div>
        )}

        <div className="mt-5">
          <Row name="User ID">
            <CopyButton text={user.id} label="Copy user ID" />
          </Row>
          <Row name="Created">
            {new Intl.DateTimeFormat(undefined, {
              dateStyle: "full",
              timeStyle: "long",
            }).format(created)}
            <div className="text-mist-400 text-sm">{formatAge(created)}</div>
          </Row>
          <Row name="Mention">
            <CopyButton text={`<@${user.id}>`} label="Copy mention" />
          </Row>
          <Row name="Avatar">
            {avatar ? (
              <ImageLinks url={avatar} name="avatar" />
            ) : (
              <span className="text-mist-400">Default avatar</span>
            )}
          </Row>
          <Row name="Banner">
            {banner ? (
              <ImageLinks url={banner} name="banner" />
            ) : (
              <span className="text-mist-400">No banner</span>
            )}
          </Row>
          <Row name="Accent color">
            {accent ? (
              <div className="flex items-center space-x-3">
                <span
                  className="h-6 w-6 rounded-md border border-white/20"
                  style={{ backgroundColor: accent }}
                />
                <CopyButton text={accent} label="Copy accent color" />
              </div>
            ) : (
              <span className="text-mist-400">None</span>
            )}
          </Row>
        </div>
      </div>
    </div>
  );
}

export default function ToolsUserLookup() {
  const [input, setInput] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  const me = useUserQuery();
  const loggedIn = me.data?.success === true;
  const lookup = useUserLookupQuery(loggedIn ? userId : null);

  const invalid = input.trim() !== "" && parseUserId(input) === undefined;

  function submit(e: FormEvent) {
    e.preventDefault();
    const id = parseUserId(input);
    if (id) setUserId(id);
  }

  let result: React.ReactNode = null;
  if (userId) {
    if (me.isLoading) {
      result = <div className="text-mist-400">Loading...</div>;
    } else if (!loggedIn) {
      result = null;
    } else if (lookup.isLoading || lookup.isFetching) {
      result = <div className="text-mist-400">Looking up user...</div>;
    } else if (lookup.data?.success) {
      result = <UserCard user={lookup.data.data} />;
    } else {
      result = (
        <div className="text-red">
          {lookup.data?.error.message ?? "The lookup failed, try again."}
        </div>
      );
    }
  }

  return (
    <div className="space-y-5">
      {!me.isLoading && !loggedIn && (
        <div className="bg-ink-700 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="text-mist-300 text-sm">
            Log in with Discord to look up users. This keeps the lookups from
            being abused.
          </div>
          <LoginLink className="bg-azure-500 hover:bg-azure-400 rounded-lg px-3 py-2 text-mist-100 flex-none">
            Log in with Discord
          </LoginLink>
        </div>
      )}
      <form onSubmit={submit} className="flex space-x-3">
        <input
          type="text"
          inputMode="numeric"
          aria-label="Discord user ID"
          className="bg-ink-900 rounded-lg px-3 py-2 w-full focus:outline-none text-mist-100 placeholder:font-light placeholder-mist-500"
          placeholder="User ID or mention, like 175928847299117063"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          type="submit"
          disabled={!loggedIn || !input.trim() || invalid}
          className="bg-azure-500 hover:bg-azure-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg px-3 py-2 text-mist-100 flex-none flex items-center space-x-2"
        >
          <MagnifyingGlassIcon className="h-4 w-4" />
          <span>Look up</span>
        </button>
      </form>
      {invalid && (
        <div className="text-red">
          That's not a Discord ID. IDs are numbers of 17 to 20 digits.
        </div>
      )}
      {result}
    </div>
  );
}

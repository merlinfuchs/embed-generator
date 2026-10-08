import Collapsable from "./Collapsable";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  DocumentDuplicateIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/20/solid";
import EditorInput from "./EditorInput";
import { RoleSelect } from "./RoleSelect";
import SavedMessageSelect from "./SavedMessageSelect";
import { Suspense, useMemo, useState } from "react";
import type { MessageAction, ResponseMessage } from "../discord/schema";
import CheckBox from "./CheckBox";
import { RolesSelect } from "./RolesSelect";
import PermissionsSelect from "./PermissionsSelect";
import { ChannelSelect } from "./ChannelSelect";
import { usePremiumGuildFeatures } from "../util/premium";
import { useGuildChannelsQuery, useSavedMessagesQuery } from "../api/queries";
import PremiumSuggest from "./PremiumSuggest";
import ValidationErrorIndicator from "./ValidationErrorIndicator";
import { lazyView } from "../util/lazyView";

const ResponseMessageModal = lazyView(() => import("./ResponseMessageModal"));

interface Props {
  guildId: string | null;
  actionCount: number;
  maxActions: number;
  actionIndex: number;
  action: MessageAction;

  collapsableId: string;
  valiationPathPrefix?: string;

  moveUp: () => void;
  moveDown: () => void;
  duplicate: () => void;
  remove: () => void;
  setType(type: number): void;
  setText(text: string): void;
  setTargetId(targetId: string): void;
  setChannelId(channelId: string): void;
  setMessage(message: ResponseMessage): void;
  setPublic(p: boolean): void;
  setAllowRoleMentions(p: boolean): void;
  setDisableDefaultResponse(p: boolean): void;
  setRoleIds(roleIds: string[]): void;
  setPermissions(permissions: string): void;
}

const actionTypes = {
  1: "Text Response",
  6: "Text DM",
  8: "Text Message Edit",
  5: "Saved Message Response",
  7: "Saved Message DM",
  9: "Saved Message Edit",
  2: "Toggle Role",
  3: "Add Role",
  4: "Remove Role",
  10: "Check Permissions",
  11: "Text Message to Channel",
  12: "Saved Message to Channel",
} as const;

/** The names of the response types when they carry a message of their own. */
const messageActionTypes = {
  5: "Message Response",
  7: "Message DM",
  9: "Message Edit",
  12: "Message to Channel",
} as const;

const actionDescriptions = {
  1: "Respond with a text message to the channel.",
  2: "Toggle a role for the user.",
  3: "Add a role to the user.",
  4: "Remove a role from the user.",
  5: "Respond with a saved message to the channel.",
  6: "Send a text message to the user via DM.",
  7: "Send a saved message to the user via DM.",
  8: "Edit the message with a new text message.",
  9: "Edit the message with a saved message.",
  10: "Check if the user has the required permissions and roles.",
  11: "Send a text message to another channel.",
  12: "Send a saved message to another channel.",
} as const;

const messageActionDescriptions = {
  5: "Respond with a message to the channel.",
  7: "Send a message to the user via DM.",
  9: "Edit the message with a new message.",
  12: "Send a message to another channel.",
} as const;

const emptyResponseMessage: ResponseMessage = {
  content: "",
  embeds: [],
  components: [],
  flags: 0,
};

export default function Action({
  guildId,
  actionCount,
  maxActions,
  actionIndex,
  action,
  collapsableId,
  valiationPathPrefix,
  moveUp,
  moveDown,
  duplicate,
  remove,
  setType,
  setText,
  setTargetId,
  setChannelId,
  setMessage,
  setPublic,
  setAllowRoleMentions,
  setDisableDefaultResponse,
  setRoleIds,
  setPermissions,
}: Props) {
  // Until the features load the server is the one to enforce this.
  const features = usePremiumGuildFeatures(guildId);
  // Sending to other channels and responding with a message of its own.
  const advancedLocked = !!features && !features.advanced_action_types;
  const showPremiumSuggest =
    advancedLocked &&
    (action.type === 11 || action.type === 12 || "message" in action);

  const actionTypeGroup = useMemo(() => {
    switch (action.type) {
      case 1:
      case 6:
      case 8:
      case 11:
        return "text_response";
      case 5:
      case 7:
      case 9:
      case 12:
        return "message" in action
          ? "message_response"
          : "saved_message_response";
      case 2:
        return "toggle_role";
      case 3:
        return "add_role";
      case 4:
        return "remove_role";
      case 10:
        return "check_permissions";
    }
  }, [action]);

  function setActionTypeGroup(type: string) {
    switch (type) {
      case "text_response":
        setType(1);
        break;
      case "message_response":
        setType(5);
        setMessage(emptyResponseMessage);
        break;
      case "saved_message_response":
        setType(5);
        break;
      case "toggle_role":
        setType(2);
        break;
      case "add_role":
        setType(3);
        break;
      case "remove_role":
        setType(4);
        break;
      case "check_permissions":
        setType(10);
        break;
    }
  }

  const responseStyle = useMemo(() => {
    switch (action.type) {
      case 1:
      case 5:
        return "channel";
      case 6:
      case 7:
        return "dm";
      case 8:
      case 9:
        return "edit";
      case 11:
      case 12:
        return "other_channel";
    }
  }, [action.type]);

  function setResponseStyle(style: string) {
    switch (style) {
      case "channel":
        if (actionTypeGroup === "text_response") {
          setType(1);
        } else {
          setType(5);
        }
        break;
      case "dm":
        if (actionTypeGroup === "text_response") {
          setType(6);
        } else {
          setType(7);
        }
        break;
      case "edit":
        if (actionTypeGroup === "text_response") {
          setType(8);
        } else {
          setType(9);
        }
        break;
      case "other_channel":
        if (actionTypeGroup === "text_response") {
          setType(11);
        } else {
          setType(12);
        }
        break;
    }

    // Changing the type starts the response over, but a message built here
    // would be a lot to lose.
    if ("message" in action) setMessage(action.message);
  }

  return (
    <div className="p-3 border-2 border-white/10 rounded-xl">
      <Collapsable
        id={collapsableId}
        validationPathPrefix={valiationPathPrefix}
        title={`Action ${actionIndex + 1}`}
        buttons={
          <div className="flex-none text-mist-300 flex items-center space-x-2">
            {actionIndex > 0 && (
              <button type="button" aria-label="Move up" onClick={moveUp}>
                <ChevronUpIcon className="h-6 w-6 flex-none" />
              </button>
            )}
            {actionIndex < actionCount - 1 && (
              <button type="button" aria-label="Move down" onClick={moveDown}>
                <ChevronDownIcon className="h-6 w-6 flex-none" />
              </button>
            )}
            {actionCount < maxActions && (
              <button type="button" aria-label="Duplicate" onClick={duplicate}>
                <DocumentDuplicateIcon className="h-5 w-5 flex-none" />
              </button>
            )}
            <button type="button" aria-label="Remove" onClick={remove}>
              <TrashIcon className="h-5 w-5 flex-none" />
            </button>
          </div>
        }
        extra={
          <div className="text-mist-500 truncate flex space-x-2 pl-1">
            <div>-</div>
            <div className="truncate">
              {"message" in action
                ? messageActionTypes[action.type]
                : actionTypes[action.type]}
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex flex-col space-y-3 xl:flex-row xl:space-x-3 xl:space-y-0">
            <div className="flex flex-col space-y-3 lg:flex-row lg:space-x-3 lg:space-y-0">
              <div className="flex-none">
                <div className="mb-1.5 flex">
                  <div className="uppercase text-mist-300 text-sm font-medium">
                    Type
                  </div>
                </div>
                <select
                  aria-label="Type"
                  className="bg-ink-900 rounded-lg p-2 w-full font-light cursor-pointer text-white"
                  value={actionTypeGroup}
                  onChange={(v) => setActionTypeGroup(v.target.value)}
                >
                  <option value="text_response">Text Response</option>
                  <option value="message_response">
                    Message Response{advancedLocked ? " (Premium)" : ""}
                  </option>
                  <option value="saved_message_response">
                    Saved Message Response
                  </option>
                  <option value="toggle_role">Toggle Role</option>
                  <option value="add_role">Add Role</option>
                  <option value="remove_role">Remove Role</option>
                  <option value="check_permissions">Check Permissions</option>
                </select>
              </div>
              {(actionTypeGroup === "text_response" ||
                actionTypeGroup === "message_response" ||
                actionTypeGroup === "saved_message_response") && (
                <div className="flex-none">
                  <div className="mb-1.5 flex">
                    <div className="uppercase text-mist-300 text-sm font-medium">
                      Target
                    </div>
                  </div>
                  <select
                    aria-label="Target"
                    className="bg-ink-900 rounded-lg p-2 w-full font-light cursor-pointer text-white"
                    value={responseStyle}
                    onChange={(v) => setResponseStyle(v.target.value)}
                  >
                    <option value="channel">Channel Message</option>
                    <option value="dm">Direct Message</option>
                    <option value="edit">Edit Message</option>
                    <option value="other_channel">
                      Other Channel{advancedLocked ? " (Premium)" : ""}
                    </option>
                  </select>
                </div>
              )}
            </div>
            <div className="flex flex-col space-y-3 lg:flex-row lg:space-x-3 lg:space-y-0">
              {(action.type === 1 || action.type === 5) && (
                <div className="flex-none">
                  <div className="mb-1.5 flex">
                    <div className="uppercase text-mist-300 text-sm font-medium">
                      Public
                    </div>
                  </div>
                  <CheckBox
                    label="Public"
                    checked={action.public}
                    onChange={setPublic}
                  />
                </div>
              )}
              {(action.type === 1 ||
                action.type === 5 ||
                action.type === 11 ||
                action.type === 12) &&
                !showPremiumSuggest && (
                  <div className="flex-none">
                    <div className="mb-1.5 flex">
                      <div className="uppercase text-mist-300 text-sm font-medium">
                        Ping Roles
                      </div>
                    </div>
                    <CheckBox
                      label="Ping Roles"
                      checked={action.allow_role_mentions}
                      onChange={(v) => setAllowRoleMentions(v)}
                    />
                  </div>
                )}
              {(action.type === 2 ||
                action.type === 3 ||
                action.type === 4 ||
                action.type === 10 ||
                action.type === 11 ||
                action.type === 12) &&
                !showPremiumSuggest && (
                  <div className="flex-none">
                    <div className="mb-1.5 flex">
                      <div className="uppercase text-mist-300 text-sm font-medium">
                        Default Response
                      </div>
                    </div>
                    <CheckBox
                      label="Default Response"
                      checked={!action.disable_default_response}
                      onChange={(v) => setDisableDefaultResponse(!v)}
                    />
                  </div>
                )}
            </div>
          </div>
          {(action.type === 11 || action.type === 12) &&
            !showPremiumSuggest && (
              <div>
                <div className="mb-1.5 flex">
                  <div className="uppercase text-mist-300 text-sm font-medium">
                    Channel
                  </div>
                </div>
                <ChannelSelect
                  guildId={guildId}
                  channelId={action.channel_id || null}
                  onChange={(v) => setChannelId(v || "")}
                  sender="bot"
                />
              </div>
            )}
          {showPremiumSuggest ? (
            <PremiumSuggest />
          ) : action.type === 1 ||
            action.type === 6 ||
            action.type === 8 ||
            action.type === 11 ? (
            <EditorInput
              label="Response"
              type="textarea"
              value={action.text}
              onChange={(v) => setText(v)}
              controls={true}
            />
          ) : action.type === 2 || action.type === 3 || action.type === 4 ? (
            <RoleSelect
              guildId={guildId}
              roleId={action.target_id || null}
              onChange={(v) => setTargetId(v || "")}
            />
          ) : "message" in action ? (
            <ResponseMessageButton
              message={action.message}
              onChange={setMessage}
              validationScope={
                valiationPathPrefix && `${valiationPathPrefix}.message`
              }
            />
          ) : action.type === 5 ||
            action.type === 7 ||
            action.type === 9 ||
            action.type === 12 ? (
            <div>
              <div className="mb-1.5 flex">
                <div className="uppercase text-mist-300 text-sm font-medium">
                  Saved Message
                </div>
              </div>
              <SavedMessageSelect
                guildId={guildId}
                messageId={action.target_id || null}
                onChange={(v) => setTargetId(v || "")}
              />
            </div>
          ) : null}
          {action.type === 12 && !showPremiumSuggest && (
            <EmbedLinksWarning guildId={guildId} action={action} />
          )}
          {action.type === 10 ? (
            <>
              <div className="flex-none">
                <div className="mb-1.5 flex">
                  <div className="uppercase text-mist-300 text-sm font-medium">
                    Required Permissions
                  </div>
                </div>
                <PermissionsSelect
                  permissions={action.permissions}
                  onChange={setPermissions}
                />
              </div>
              <div className="flex-none">
                <div className="mb-1.5 flex">
                  <div className="uppercase text-mist-300 text-sm font-medium">
                    Required Roles
                  </div>
                </div>
                <RolesSelect
                  guildId={guildId}
                  roleIds={action.role_ids}
                  onChange={setRoleIds}
                />
              </div>
              {action.disable_default_response && (
                <EditorInput
                  label="Error Response"
                  type="textarea"
                  value={action.text || ""}
                  onChange={(v) => setText(v)}
                  controls={true}
                />
              )}
            </>
          ) : null}

          <div className="text-mist-500 text-sm whitespace-normal">
            {"message" in action
              ? messageActionDescriptions[action.type]
              : actionDescriptions[action.type]}
          </div>
        </div>
      </Collapsable>
    </div>
  );
}

/**
 * The bot needs Embed Links for embeds in its own messages, which webhooks don't. Sending to another
 * channel goes through the bot, so a message with embeds needs it there.
 */
function EmbedLinksWarning({
  guildId,
  action,
}: {
  guildId: string | null;
  action: Extract<MessageAction, { type: 12 }>;
}) {
  const { data: channels } = useGuildChannelsQuery(guildId);
  const { data: messages } = useSavedMessagesQuery(guildId);

  const channel = channels?.success
    ? channels.data.find((c) => c.id === action.channel_id)
    : undefined;
  const hasEmbeds =
    "message" in action
      ? action.message.embeds.length > 0
      : messages?.success &&
        !!messages.data.find((m) => m.id === action.target_id)?.data?.embeds
          ?.length;

  if (!channel || channel.bot_can_embed || !hasEmbeds) {
    return null;
  }

  return (
    <div className="text-amber-300 text-sm">
      The bot is missing the Embed Links permission in this channel, so it can't
      post this message's embeds there. Give it Embed Links in the channel's
      permission settings.
    </div>
  );
}

function ResponseMessageButton({
  message,
  onChange,
  validationScope,
}: {
  message: ResponseMessage;
  onChange: (message: ResponseMessage) => void;
  validationScope?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="px-3 py-2 rounded-lg bg-azure-500 hover:bg-azure-400 text-white transition-colors flex items-center space-x-2"
        onClick={() => setOpen(true)}
      >
        <PencilSquareIcon className="h-5 w-5 flex-none" />
        <span>Edit Message</span>
        {validationScope && (
          <ValidationErrorIndicator scope={validationScope} />
        )}
      </button>
      {open && (
        <Suspense>
          <ResponseMessageModal
            message={message}
            onChange={onChange}
            onClose={() => setOpen(false)}
          />
        </Suspense>
      )}
    </>
  );
}

import Collapsable from "./Collapsable";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  DocumentDuplicateIcon,
  TrashIcon,
} from "@heroicons/react/20/solid";
import EditorInput from "./EditorInput";
import { RoleSelect } from "./RoleSelect";
import SavedMessageSelect from "./SavedMessageSelect";
import { useMemo } from "react";
import { MessageAction } from "../discord/schema";
import CheckBox from "./CheckBox";
import { RolesSelect } from "./RolesSelect";
import PermissionsSelect from "./PermissionsSelect";

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
} as const;

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
  setPublic,
  setAllowRoleMentions,
  setDisableDefaultResponse,
  setRoleIds,
  setPermissions,
}: Props) {
  const actionTypeGroup = useMemo(() => {
    switch (action.type) {
      case 1:
      case 6:
      case 8:
        return "text_response";
      case 5:
      case 7:
      case 9:
        return "saved_message_response";
      case 2:
        return "toggle_role";
      case 3:
        return "add_role";
      case 4:
        return "remove_role";
      case 10:
        return "check_permissions";
    }
  }, [action.type]);

  function setActionTypeGroup(type: string) {
    switch (type) {
      case "text_response":
        setType(1);
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
    }
  }

  return (
    <div className="p-3 border-2 border-dark-6 rounded-md">
      <Collapsable
        id={collapsableId}
        validationPathPrefix={valiationPathPrefix}
        title={`Action ${actionIndex + 1}`}
        buttons={
          <div className="flex-none text-gray-300 flex items-center space-x-2">
            {actionIndex > 0 && (
              <ChevronUpIcon
                className="h-6 w-6 flex-none"
                role="button"
                onClick={moveUp}
              />
            )}
            {actionIndex < actionCount - 1 && (
              <ChevronDownIcon
                className="h-6 w-6 flex-none"
                role="button"
                onClick={moveDown}
              />
            )}
            {actionCount < maxActions && (
              <DocumentDuplicateIcon
                className="h-5 w-5 flex-none"
                role="button"
                onClick={duplicate}
              />
            )}
            <TrashIcon
              className="h-5 w-5 flex-none"
              role="button"
              onClick={remove}
            />
          </div>
        }
        extra={
          <div className="text-gray-500 truncate flex space-x-2 pl-1">
            <div>-</div>
            <div className="truncate">{actionTypes[action.type]}</div>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex flex-col space-y-3 xl:flex-row xl:space-x-3 xl:space-y-0">
            <div className="flex flex-col space-y-3 lg:flex-row lg:space-x-3 lg:space-y-0">
              <div className="flex-none">
                <div className="mb-1.5 flex">
                  <div className="uppercase text-gray-300 text-sm font-medium">
                    Type
                  </div>
                </div>
                <select
                  className="bg-dark-2 rounded p-2 w-full no-ring font-light cursor-pointer text-white"
                  value={actionTypeGroup}
                  onChange={(v) => setActionTypeGroup(v.target.value)}
                >
                  <option value="text_response">Text Response</option>
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
                actionTypeGroup === "saved_message_response") && (
                <div className="flex-none">
                  <div className="mb-1.5 flex">
                    <div className="uppercase text-gray-300 text-sm font-medium">
                      Target
                    </div>
                  </div>
                  <select
                    className="bg-dark-2 rounded p-2 w-full no-ring font-light cursor-pointer text-white"
                    value={responseStyle}
                    onChange={(v) => setResponseStyle(v.target.value)}
                  >
                    <option value="channel">Channel Message</option>
                    <option value="dm">Direct Message</option>
                    <option value="edit">Edit Message</option>
                  </select>
                </div>
              )}
            </div>
            <div className="flex flex-col space-y-3 lg:flex-row lg:space-x-3 lg:space-y-0">
              {(action.type === 1 || action.type === 5) && (
                <div className="flex-none">
                  <div className="mb-1.5 flex">
                    <div className="uppercase text-gray-300 text-sm font-medium">
                      Public
                    </div>
                  </div>
                  <CheckBox checked={action.public} onChange={setPublic} />
                </div>
              )}
              {(action.type === 1 || action.type === 5) && (
                <div className="flex-none">
                  <div className="mb-1.5 flex">
                    <div className="uppercase text-gray-300 text-sm font-medium">
                      Ping Roles
                    </div>
                  </div>
                  <CheckBox
                    checked={action.allow_role_mentions}
                    onChange={(v) => setAllowRoleMentions(v)}
                  />
                </div>
              )}
              {(action.type === 2 ||
                action.type === 3 ||
                action.type === 4 ||
                action.type === 10) && (
                <div className="flex-none">
                  <div className="mb-1.5 flex">
                    <div className="uppercase text-gray-300 text-sm font-medium">
                      Default Response
                    </div>
                  </div>
                  <CheckBox
                    checked={!action.disable_default_response}
                    onChange={(v) => setDisableDefaultResponse(!v)}
                  />
                </div>
              )}
            </div>
          </div>
          {action.type === 1 || action.type === 6 || action.type === 8 ? (
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
          ) : action.type === 5 || action.type === 7 || action.type === 9 ? (
            <SavedMessageSelect
              guildId={guildId}
              messageId={action.target_id || null}
              onChange={(v) => setTargetId(v || "")}
            />
          ) : action.type === 10 ? (
            <>
              <div className="flex-none">
                <div className="mb-1.5 flex">
                  <div className="uppercase text-gray-300 text-sm font-medium">
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
                  <div className="uppercase text-gray-300 text-sm font-medium">
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

          <div className="text-gray-500 text-sm whitespace-normal">
            {actionDescriptions[action.type]}
          </div>
        </div>
      </Collapsable>
    </div>
  );
}

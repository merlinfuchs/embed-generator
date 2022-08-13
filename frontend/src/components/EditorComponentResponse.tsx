import { useMemo } from "react";
import StyledInput from "./StyledInput";

interface Props {
  customId: string;
  setCustomId: (custom_id: string) => void;
  errors?: string[];
}

const ACTION_RE = /{([0-9]+):([a-zA-Z0-9_-]*)(?::([0-9]+))?\}/g;

type Action =
  | {
      type: "responseSavedMessage";
      messageId: string;
      flags: number;
    }
  | {
      type: "roleToggle";
      roleId: string;
    };

export default function EditorComponentResponse({
  customId,
  setCustomId,
  errors,
}: Props) {
  const action = useMemo(() => {
    const match = ACTION_RE.exec(customId);
    ACTION_RE.lastIndex = 0;
    if (match) {
      const [, type, identifier, flags] = match;
      if (type === "0") {
        return {
          type: "responseSavedMessage",
          messageId: identifier,
          flags: parseInt(flags || "0", 10) || 0,
        } as Action;
      } else if (type === "1") {
        return {
          type: "roleToggle",
          roleId: identifier,
        } as Action;
      }
    }
    return null;
  }, [customId]);

  function setAction(action: Action) {
    if (action.type === "responseSavedMessage") {
      setCustomId(`{0:${action.messageId}:${action.flags}}`);
    } else if (action.type === "roleToggle") {
      setCustomId(`{1:${action.roleId}}`);
    }
  }

  function changeResponseType(
    type: "responsePlainText" | "responseSavedMessage" | "roleToggle"
  ) {
    if (type === "responsePlainText") {
      setCustomId("");
    } else if (type === "responseSavedMessage") {
      setAction({ type: "responseSavedMessage", messageId: "", flags: 0 });
    } else if (type === "roleToggle") {
      setAction({ type: "roleToggle", roleId: "" });
    }
  }

  return (
    <div className="md:flex md:space-x-2 space-y-4 md:space-y-0">
      <div>
        <div className="uppercase text-gray-300 text-sm font-medium mb-1.5">
          Response Type
        </div>
        <select
          className="bg-dark-2 rounded px-3 py-2 w-full sm:w-64 cursor-pointer"
          value={action?.type || "responsePlainText"}
          onChange={(e) => changeResponseType(e.target.value as any)}
        >
          <option value="responsePlainText">Plain Text</option>
          <option value="responseSavedMessage">Saved Message</option>
          <option value="roleToggle">Toggle Role</option>
        </select>
      </div>
      {!!action && action.type === "responseSavedMessage" && (
        <StyledInput
          className="flex-auto"
          type="text"
          label="Message ID"
          value={action.messageId}
          onChange={(v) =>
            setAction({
              type: "responseSavedMessage",
              messageId: v,
              flags: 0,
            })
          }
          errors={errors}
        />
      )}
      {!!action && action.type === "roleToggle" && (
        <StyledInput
          className="flex-auto"
          type="text"
          label="Role ID"
          value={action.roleId}
          onChange={(v) =>
            setAction({
              type: "roleToggle",
              roleId: v,
            })
          }
          errors={errors}
        />
      )}
      {!action && (
        <StyledInput
          className="flex-auto"
          type="text"
          label="Text"
          maxLength={100}
          value={customId}
          onChange={setCustomId}
          errors={errors}
        />
      )}
    </div>
  );
}

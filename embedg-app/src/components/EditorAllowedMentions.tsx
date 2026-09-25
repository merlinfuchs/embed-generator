import {
  MENTION_TYPES,
  type MentionType,
  mentionPings,
  setMentionPings,
} from "../discord/allowedMentions";
import {
  type MessageNode,
  useDocument,
  useDocumentStoreApi,
} from "../state/document";
import { nodeScope } from "../state/validationError";
import CheckBox from "./CheckBox";
import Collapsable from "./Collapsable";

const labels: Record<MentionType, string> = {
  users: "Users",
  roles: "Roles",
  everyone: "@everyone and @here",
};

export default function EditorAllowedMentions() {
  const rootId = useDocument((state) => state.rootId);
  // Just the field: the root node changes with every keystroke in the content.
  const allowedMentions = useDocument(
    (state) =>
      (state.nodes[state.rootId] as MessageNode | undefined)?.allowed_mentions,
  );
  const { update } = useDocumentStoreApi().getState();

  return (
    <Collapsable
      id="allowed_mentions"
      title="Mentions"
      size="large"
      defaultCollapsed={true}
      validationPathPrefix={nodeScope<MessageNode>(rootId, [
        "allowed_mentions",
      ])}
    >
      <div className="text-mist-400 mb-3">
        Choose which mentions ping. The others still show, but notify no one.
      </div>
      <div className="flex flex-wrap gap-5">
        {MENTION_TYPES.map((type) => (
          <div key={type} className="flex items-center space-x-2">
            <CheckBox
              label={labels[type]}
              checked={mentionPings(allowedMentions, type)}
              onChange={(pings) =>
                update<MessageNode>(rootId, {
                  allowed_mentions: setMentionPings(
                    allowedMentions,
                    type,
                    pings,
                  ),
                })
              }
            />
            <div className="text-mist-100">{labels[type]}</div>
          </div>
        ))}
      </div>
    </Collapsable>
  );
}

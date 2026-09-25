import {
  MENTION_TYPES,
  type MentionType,
  mentionPings,
  setMentionPings,
} from "../discord/allowedMentions";
import {
  type MessageNode,
  useAllowedMentions,
  useDocument,
  useDocumentStoreApi,
} from "../state/document";
import CheckBox from "./CheckBox";

const labels: Record<MentionType, string> = {
  users: "Users",
  roles: "Roles",
  everyone: "@everyone and @here",
};

export default function EditorAllowedMentions() {
  const rootId = useDocument((state) => state.rootId);
  const allowedMentions = useAllowedMentions();
  const { update } = useDocumentStoreApi().getState();

  return (
    <div>
      <div className="uppercase text-mist-300 text-sm font-medium mb-1.5">
        Mentions
      </div>
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
    </div>
  );
}

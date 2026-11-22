import { QuestionMarkCircleIcon } from "@heroicons/react/24/outline";
import {
  type MessageNode,
  SUPPRESS_NOTIFICATIONS_FLAG,
  useDocumentStoreApi,
  useSilent,
} from "../state/document";
import { op } from "../util/analytics";
import CheckBox from "./CheckBox";
import Tooltip from "./Tooltip";

const HELP =
  "A silent message is sent without push or desktop notifications, like starting a message with @silent in Discord. It still shows up in the channel as normal.";

export default function EditorSilentSetting() {
  const store = useDocumentStoreApi();
  const silent = useSilent();

  const toggle = () => {
    const { rootId, nodes, update } = store.getState();
    const root = nodes[rootId];
    if (root?.type !== "message") return;

    update<MessageNode>(rootId, {
      flags: (root.flags ?? 0) ^ SUPPRESS_NOTIFICATIONS_FLAG,
    });
    op.track("silent_toggled", { enabled: !silent });
  };

  return (
    <div>
      <div className="uppercase text-mist-300 text-sm font-medium mb-1.5">
        Notifications
      </div>
      <div className="flex items-center space-x-2">
        <CheckBox label="Silent message" checked={silent} onChange={toggle} />
        <div className="text-mist-100">Silent message</div>
        <Tooltip text={HELP} wide>
          <QuestionMarkCircleIcon
            aria-label="What is a silent message?"
            className="h-5 w-5 text-mist-400 hover:text-mist-100"
          />
        </Tooltip>
      </div>
    </div>
  );
}

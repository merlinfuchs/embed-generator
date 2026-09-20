import {
  type EmbedNode,
  type NodeId,
  useDocumentStore,
  useNode,
} from "../state/document";
import { patchGroup } from "../util/patch";
import Collapsable from "./Collapsable";
import DateTimePicker from "./DateTimePicker";
import EditorInput from "./EditorInput";

interface Props {
  id: NodeId;
}

export default function EditorEmbedFooter({ id }: Props) {
  const embed = useNode<EmbedNode>(id);
  const { update } = useDocumentStore.getState();

  if (!embed) return null;

  const footer = embed.footer;

  function patchFooter(patch: Partial<NonNullable<EmbedNode["footer"]>>) {
    update<EmbedNode>(id, { footer: patchGroup(footer, patch) });
  }

  return (
    <Collapsable
      title="Footer"
      id={`embeds.${id}.footer`}
      validationNodeId={id}
      validationFields={["footer", "timestamp"]}
    >
      <div className="space-y-3">
        <EditorInput
          label="Footer"
          value={footer?.text || ""}
          onChange={(v) => patchFooter({ text: v || undefined })}
          maxLength={2048}
          validationNodeId={id}
          validationField="footer.text"
        />
        <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3">
          <EditorInput
            type="url"
            label="Footer Icon URL"
            value={footer?.icon_url || ""}
            onChange={(v) => patchFooter({ icon_url: v || undefined })}
            className="md:w-1/2"
            validationNodeId={id}
            validationField="footer.icon_url"
            imageUpload={true}
          />
          <div className="md:w-1/2">
            <div className="mb-1.5 flex">
              <div className="uppercase text-gray-300 text-sm font-medium">
                Timestamp
              </div>
            </div>
            <DateTimePicker
              onChange={(v) => update<EmbedNode>(id, { timestamp: v })}
              value={embed.timestamp}
              clearable={true}
            />
          </div>
        </div>
      </div>
    </Collapsable>
  );
}

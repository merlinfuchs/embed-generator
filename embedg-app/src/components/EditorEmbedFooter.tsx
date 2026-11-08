import {
  type EmbedNode,
  type FieldPath,
  type NodeId,
  useNode,
  useDocumentStoreApi,
} from "../state/document";
import { patchGroup } from "../util/patch";
import { nodeField, nodeScope } from "../state/validationError";
import CheckBox from "./CheckBox";
import Collapsable from "./Collapsable";
import DateTimePicker from "./DateTimePicker";
import EditorInput from "./EditorInput";
import ValidationError from "./ValidationError";

const FOOTER_FIELDS: FieldPath<EmbedNode>[] = [
  "footer",
  "timestamp",
  "timestamp_now",
];

interface Props {
  id: NodeId;
}

export default function EditorEmbedFooter({ id }: Props) {
  const embed = useNode<EmbedNode>(id);
  const { update } = useDocumentStoreApi().getState();

  if (!embed) return null;

  const footer = embed.footer;

  function patchFooter(patch: Partial<NonNullable<EmbedNode["footer"]>>) {
    update<EmbedNode>(id, { footer: patchGroup(footer, patch) });
  }

  return (
    <Collapsable
      title="Footer"
      id={`embeds.${id}.footer`}
      validationPathPrefix={nodeScope<EmbedNode>(id, FOOTER_FIELDS)}
    >
      <div className="space-y-3">
        <EditorInput
          label="Footer"
          value={footer?.text || ""}
          onChange={(v) => patchFooter({ text: v || undefined })}
          maxLength={2048}
          validationPath={nodeField<EmbedNode>(id, "footer.text")}
        />
        <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3">
          <EditorInput
            type="url"
            label="Footer Icon URL"
            value={footer?.icon_url || ""}
            onChange={(v) => patchFooter({ icon_url: v || undefined })}
            className="md:w-1/2"
            validationPath={nodeField<EmbedNode>(id, "footer.icon_url")}
            imageUpload={true}
          />
          <div className="md:w-1/2">
            <div className="mb-1.5 flex">
              <div className="uppercase text-mist-300 text-sm font-medium">
                Timestamp
              </div>
            </div>
            {embed.timestamp_now ? (
              <div className="h-[34px] flex items-center text-sm text-mist-400">
                Shows the time the message is sent
              </div>
            ) : (
              <DateTimePicker
                onChange={(v) => update<EmbedNode>(id, { timestamp: v })}
                value={embed.timestamp}
              />
            )}
            <ValidationError target={nodeField<EmbedNode>(id, "timestamp")} />
            <div className="flex items-center space-x-2 mt-2">
              <CheckBox
                label="Use the time of sending as the timestamp"
                checked={embed.timestamp_now ?? false}
                onChange={(v) =>
                  update<EmbedNode>(id, { timestamp_now: v || undefined })
                }
              />
              <div className="text-sm font-medium text-mist-300">
                Time of sending
              </div>
            </div>
          </div>
        </div>
      </div>
    </Collapsable>
  );
}

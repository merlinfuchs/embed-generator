import { useMemo } from "react";
import {
  type EmbedNode,
  type NodeId,
  useNode,
  useNodeActions,
  useNodeIndex,
} from "../state/document";
import { colorIntToHex } from "../util/discord";
import { nodeScope } from "../state/validationError";
import EditorComponentCollapsable from "./EditorComponentCollapsable";
import EditorEmbedAuthor from "./EditorEmbedAuthor";
import EditorEmbedBody from "./EditorEmbedBody";
import EditorEmbedFields from "./EditorEmbedFields";
import EditorEmbedFooter from "./EditorEmbedFooter";
import EditorEmbedImages from "./EditorEmbedImages";

interface Props {
  id: NodeId;
}

export default function EditorEmbed({ id }: Props) {
  const embed = useNode<EmbedNode>(id);
  const { index } = useNodeIndex(id);
  const actions = useNodeActions(id, 10);

  const hexColor = useMemo(
    () => (embed?.color !== undefined ? colorIntToHex(embed.color) : "#1f2225"),
    [embed?.color],
  );

  if (!embed) return null;

  const name = embed.author?.name || embed.title;

  return (
    <EditorComponentCollapsable
      id={`embeds.${id}`}
      validationPathPrefix={nodeScope<EmbedNode>(id)}
      title={`Embed ${index + 1}`}
      size="large"
      defaultCollapsed={true}
      className="bg-dark-3 p-3 rounded-md border-l-4"
      style={{ borderColor: hexColor }}
      extra={
        name && (
          <div className="text-gray-500 truncate flex space-x-2 pl-2">
            <div>-</div>
            <div className="truncate">{name}</div>
          </div>
        )
      }
      {...actions}
    >
      <div className="space-y-4">
        <EditorEmbedAuthor id={id} />
        <EditorEmbedBody id={id} />
        <EditorEmbedImages id={id} />
        <EditorEmbedFooter id={id} />
        <EditorEmbedFields id={id} />
      </div>
    </EditorComponentCollapsable>
  );
}

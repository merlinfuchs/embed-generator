import {
  ChevronDownIcon,
  ChevronUpIcon,
  DocumentDuplicateIcon,
  TrashIcon,
} from "@heroicons/react/20/solid";
import { useMemo } from "react";
import {
  type EmbedNode,
  type NodeId,
  useChildIds,
  useDocumentStore,
  useNode,
  useNodePath,
} from "../state/document";
import { colorIntToHex } from "../util/discord";
import Collapsable from "./Collapsable";
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
  const path = useNodePath(id);

  const rootId = useDocumentStore((state) => state.rootId);
  const embedIds = useChildIds(rootId, "embeds");
  const move = useDocumentStore((state) => state.move);
  const duplicate = useDocumentStore((state) => state.duplicate);
  const remove = useDocumentStore((state) => state.remove);

  const index = embedIds.indexOf(id);

  const hexColor = useMemo(
    () => (embed?.color !== undefined ? colorIntToHex(embed.color) : "#1f2225"),
    [embed?.color],
  );

  if (!embed) return null;

  const name = embed.author?.name || embed.title;

  return (
    <div
      className="bg-dark-3 p-3 rounded-md border-l-4"
      style={{ borderColor: hexColor }}
    >
      <Collapsable
        title={`Embed ${index + 1}`}
        id={`embeds.${id}`}
        validationPathPrefix={path}
        size="large"
        defaultCollapsed={true}
        extra={
          name && (
            <div className="text-gray-500 truncate flex space-x-2 pl-2">
              <div>-</div>
              <div className="truncate">{name}</div>
            </div>
          )
        }
        buttons={
          <div className="flex-none text-gray-300 flex items-center space-x-2">
            {index > 0 && (
              <ChevronUpIcon
                className="h-6 w-6 flex-none"
                role="button"
                onClick={() => move(id, -1)}
              />
            )}
            {index < embedIds.length - 1 && (
              <ChevronDownIcon
                className="h-6 w-6 flex-none"
                role="button"
                onClick={() => move(id, 1)}
              />
            )}
            {embedIds.length < 10 && (
              <DocumentDuplicateIcon
                className="h-5 w-5 flex-none"
                role="button"
                onClick={() => duplicate(id)}
              />
            )}
            <TrashIcon
              className="h-5 w-5 flex-none"
              role="button"
              onClick={() => remove(id)}
            />
          </div>
        }
      >
        <div className="space-y-4">
          <EditorEmbedAuthor id={id} />
          <EditorEmbedBody id={id} />
          <EditorEmbedImages id={id} />
          <EditorEmbedFooter id={id} />
          <EditorEmbedFields id={id} />
        </div>
      </Collapsable>
    </div>
  );
}

import {
  ChevronDownIcon,
  ChevronUpIcon,
  DocumentDuplicateIcon,
  TrashIcon,
} from "@heroicons/react/20/solid";
import { useMemo } from "react";
import { shallow } from "zustand/shallow";
import { useCurrentMessageStore } from "../state/message";
import { colorIntToHex } from "../util/discord";
import Collapsable from "./Collapsable";
import EditorEmbedAuthor from "./EditorEmbedAuthor";
import EditorEmbedBody from "./EditorEmbedBody";
import EditorEmbedFields from "./EditorEmbedFields";
import EditorEmbedFooter from "./EditorEmbedFooter";
import EditorEmbedImages from "./EditorEmbedImages";

interface Props {
  embedIndex: number;
  embedId: number;
}

export default function EditorEmbed({ embedIndex, embedId }: Props) {
  const embedName = useCurrentMessageStore((state) => {
    const embed = state.embeds[embedIndex];
    return embed.author?.name || embed.title;
  });
  const embedCount = useCurrentMessageStore((state) => state.embeds.length);

  const [moveUp, moveDown, duplicate, remove] = useCurrentMessageStore(
    (state) => [
      state.moveEmbedUp,
      state.moveEmbedDown,
      state.duplicateEmbed,
      state.deleteEmbed,
    ],
    shallow
  );

  const color = useCurrentMessageStore(
    (state) => state.embeds[embedIndex]?.color
  );

  const hexColor = useMemo(
    () => (color !== undefined ? colorIntToHex(color) : "#1f2225"),
    [color]
  );

  function wrappedRemove() {
    remove(embedIndex);
  }

  return (
    <div
      className="bg-dark-3 p-3 rounded-md border-l-4"
      style={{ borderColor: hexColor }}
    >
      <Collapsable
        title={`Embed ${embedIndex + 1}`}
        id={`embeds.${embedId}`}
        validationPathPrefix={`embeds.${embedIndex}`}
        size="large"
        defaultCollapsed={true}
        extra={
          embedName && (
            <div className="text-gray-500 truncate flex space-x-2 pl-2">
              <div>-</div>
              <div className="truncate">{embedName}</div>
            </div>
          )
        }
        buttons={
          <div className="flex-none text-gray-300 flex items-center space-x-2">
            {embedIndex > 0 && (
              <ChevronUpIcon
                className="h-6 w-6 flex-none"
                role="button"
                onClick={() => moveUp(embedIndex)}
              />
            )}
            {embedIndex < embedCount - 1 && (
              <ChevronDownIcon
                className="h-6 w-6 flex-none"
                role="button"
                onClick={() => moveDown(embedIndex)}
              />
            )}
            {embedCount < 10 && (
              <DocumentDuplicateIcon
                className="h-5 w-5 flex-none"
                role="button"
                onClick={() => duplicate(embedIndex)}
              />
            )}
            <TrashIcon
              className="h-5 w-5 flex-none"
              role="button"
              onClick={wrappedRemove}
            />
          </div>
        }
      >
        <div className="space-y-4">
          <EditorEmbedAuthor embedIndex={embedIndex} embedId={embedId} />
          <EditorEmbedBody embedIndex={embedIndex} embedId={embedId} />
          <EditorEmbedImages embedIndex={embedIndex} embedId={embedId} />
          <EditorEmbedFooter embedIndex={embedIndex} embedId={embedId} />
          <EditorEmbedFields embedIndex={embedIndex} embedId={embedId} />
        </div>
      </Collapsable>
    </div>
  );
}

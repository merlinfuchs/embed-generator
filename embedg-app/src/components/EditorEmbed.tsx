import { useCurrentMessageStore } from "../state/message";
import EditorEmbedAuthor from "./EditorEmbedAuthor";
import Collapsable from "./Collapsable";
import EditorEmbedBody from "./EditorEmbedBody";
import EditorEmbedFields from "./EditorEmbedFields";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  DocumentDuplicateIcon,
  TrashIcon,
} from "@heroicons/react/20/solid";
import { shallow } from "zustand/shallow";

interface Props {
  embedIndex: number;
}

export default function EditorEmbed({ embedIndex }: Props) {
  const embedId = useCurrentMessageStore(
    (state) => state.embeds[embedIndex].id
  );
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

  return (
    <div className="mb-3 bg-dark-3 p-3 rounded-md border-l-4 border-green">
      <Collapsable
        title={`Embed ${embedIndex + 1}`}
        id={`embeds.${embedId}`}
        size="large"
        extra={
          embedName && (
            <div className="text-gray-400 truncate flex space-x-3 pl-2">
              <div>-</div>
              <div className="truncate">{embedName}</div>
            </div>
          )
        }
        buttons={
          <div className="flex-none text-gray-300 flex items-center space-x-1">
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
              onClick={() => remove(embedIndex)}
            />
          </div>
        }
      >
        <div className="space-y-4">
          <EditorEmbedAuthor embedIndex={embedIndex} />
          <EditorEmbedBody embedIndex={embedIndex} />
          <EditorEmbedFields embedIndex={embedIndex} />
        </div>
      </Collapsable>
    </div>
  );
}

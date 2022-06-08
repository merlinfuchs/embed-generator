import { useMemo, useState } from "react";
import { Embed } from "../discord/types";
import useMessage from "../hooks/useMessage";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  DuplicateIcon,
  TrashIcon,
} from "@heroicons/react/outline";
import EditorEmbedAuthor from "./EditorEmbedAuthor";
import EditorEmbedBody from "./EditorEmbedBody";
import EditorEmbedFields from "./EditorEmbedFields";
import EditorEmbedImages from "./EditorEmbedImages";
import EditorEmbedFooter from "./EditorEmbedFooter";

interface Props {
  index: number;
  embed: Embed;
}

export default function EditorEmbed({ index, embed }: Props) {
  const [msg, dispatch] = useMessage();

  const [collapsed, setCollapsed] = useState(true);
  const hexColor = useMemo(
    () => (embed.color ? "#" + embed.color.toString(16) : "#1f2225"),
    [embed.color]
  );

  return (
    <div
      className="bg-dark-3 rounded-md px-3 md:px-4 py-3 mb-3 shadow border-l-4"
      style={{ borderColor: hexColor }}
    >
      <div className="flex items-center">
        <div
          className="text-medium text-lg flex-auto cursor-pointer flex items-center space-x-2 select-none overflow-hidden"
          onClick={() => setCollapsed(!collapsed)}
        >
          <ChevronRightIcon
            className={`h-6 w-6 transition-transform duration-300 ${
              collapsed ? "" : "rotate-90"
            }`}
          />
          <div className="flex-none">Embed {index + 1}</div>
          {embed.author?.name || embed.title ? (
            <div className="text-gray-500 truncate">
              - {embed.author?.name || embed.title}
            </div>
          ) : undefined}
        </div>
        <div className="flex space-x-3 flex-none">
          {index !== 0 ? (
            <ChevronUpIcon
              className="h-5 w-5 cursor-pointer"
              role="button"
              onClick={() => dispatch({ type: "moveEmbedUp", index })}
            />
          ) : undefined}
          {index !== msg.embeds.length - 1 ? (
            <ChevronDownIcon
              className="h-5 w-5 cursor-pointer"
              role="button"
              onClick={() => dispatch({ type: "moveEmbedDown", index })}
            />
          ) : undefined}
          <DuplicateIcon
            className="h-5 w-5 cursor-pointer"
            role="button"
            onClick={() => dispatch({ type: "cloneEmbed", index })}
          />
          <TrashIcon
            className="h-5 w-5 cursor-pointer"
            onClick={() => dispatch({ type: "removeEmbed", index })}
          />
        </div>
      </div>
      {!collapsed ? (
        <div className="space-y-5 mt-3">
          <EditorEmbedAuthor index={index} embed={embed} />
          <EditorEmbedBody index={index} embed={embed} />
          <EditorEmbedFields index={index} embed={embed} />
          <EditorEmbedImages index={index} embed={embed} />
          <EditorEmbedFooter index={index} embed={embed} />
        </div>
      ) : undefined}
    </div>
  );
}

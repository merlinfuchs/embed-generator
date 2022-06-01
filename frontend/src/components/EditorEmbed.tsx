import { useState } from "react";
import { Embed } from "../discord";
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
  const [, dispatch] = useMessage();

  const [collapsed, setCollapsed] = useState(true);

  return (
    <div className="bg-dark-3 rounded-md px-3 md:px-4 py-3 mb-3 shadow">
      <div className="flex items-center">
        <div
          className="text-medium text-lg flex-auto cursor-pointer flex items-center space-x-2 select-none"
          onClick={() => setCollapsed(!collapsed)}
        >
          <ChevronRightIcon
            className={`h-6 w-6 transition-transform duration-300 ${
              collapsed ? "" : "rotate-90"
            }`}
          />
          <div>Embed {index + 1}</div>
        </div>
        <div className="flex space-x-3">
          <ChevronUpIcon className="h-5 w-5" />
          <ChevronDownIcon className="h-5 w-5" />
          <DuplicateIcon className="h-5 w-5" />
          <TrashIcon
            className="h-5 w-5 cursor-pointer"
            onClick={() => dispatch({ type: "removeEmbed", index })}
          />
        </div>
      </div>
      {!collapsed ? (
        <div className="space-y-5 mt-3">
          <EditorEmbedAuthor />
          <EditorEmbedBody />
          <EditorEmbedImages />
          <EditorEmbedFooter />
          <EditorEmbedFields index={index} embed={embed} />
        </div>
      ) : undefined}
    </div>
  );
}

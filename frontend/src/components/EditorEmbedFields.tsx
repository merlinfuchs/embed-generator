import { ChevronRightIcon } from "@heroicons/react/outline";
import { useState } from "react";
import { Embed } from "../discord/types";
import useMessage from "../hooks/useMessage";
import EditorEmbedField from "./EditorEmbedField";

interface Props {
  index: number;
  embed: Embed;
}

export default function EditorEmbedFields({ index, embed }: Props) {
  const [, dispatch] = useMessage();
  const [collapsed, setCollapsed] = useState(true);

  return (
    <div>
      <div
        className="text-medium flex-auto cursor-pointer flex items-center space-x-2 text-gray-300 select-none"
        onClick={() => setCollapsed(!collapsed)}
      >
        <ChevronRightIcon
          className={`h-5 w-5 transition-transform duration-300 ${
            collapsed ? "" : "rotate-90"
          }`}
        />
        <div>Fields</div>
      </div>
      {!collapsed ? (
        <div className="mt-3">
          {embed.fields.map((field, i) => (
            <EditorEmbedField
              field={field}
              key={field.id}
              index={i}
              embed={embed}
              embedIndex={index}
            />
          ))}
          <div className="space-x-3 mt-3">
            {embed.fields.length < 25 ? (
              <button
                className="bg-blurple px-3 py-2 rounded transition-colors hover:bg-blurple-dark"
                onClick={() => dispatch({ type: "addEmbedField", index })}
              >
                Add Field
              </button>
            ) : (
              <button
                disabled
                className="bg-dark-2 px-3 py-2 rounded transition-colors cursor-not-allowed text-gray-400"
              >
                Add Field
              </button>
            )}
            <button
              className="px-3 py-2 rounded border border-red hover:bg-red transition-colors"
              onClick={() => dispatch({ type: "clearEmbedFields", index })}
            >
              Clear Fields
            </button>
          </div>
        </div>
      ) : undefined}
    </div>
  );
}

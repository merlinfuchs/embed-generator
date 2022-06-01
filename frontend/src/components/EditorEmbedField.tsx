import {
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  DuplicateIcon,
  TrashIcon,
} from "@heroicons/react/outline";
import { useState } from "react";
import { EmbedField } from "../discord";
import useMessage from "../hooks/useMessage";

interface Props {
  field: EmbedField;
  index: number;
  embedIndex: number;
}

export default function EditorEmbedField({ field, index, embedIndex }: Props) {
  const [, dispatch] = useMessage();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div>
      <div className="border border-dark-6 px-3 md:px-4 rounded-md mb-3">
        <div className="flex items-center py-3">
          <div
            className="text-medium flex-auto cursor-pointer flex items-center space-x-2 select-none"
            onClick={() => setCollapsed(!collapsed)}
          >
            <ChevronRightIcon
              className={`h-5 w-5 transition-transform duration-300 ${
                collapsed ? "" : "rotate-90"
              }`}
            />
            <div>Field {index + 1}</div>
          </div>
          <div className="flex space-x-3">
            <ChevronUpIcon className="h-4 w-4" />
            <ChevronDownIcon className="h-4 w-4" />
            <DuplicateIcon className="h-4 w-4" />
            <TrashIcon
              className="h-4 w-4 cursor-pointer"
              onClick={() => dispatch({ type: "removeEmbed", index })}
            />
          </div>
        </div>
        {!collapsed ? (
          <div className="space-y-4 pb-3">
            <div>
              <div className="uppercase text-gray-300 text-sm font-medium mb-1.5">
                Name
              </div>
              <input
                type="text"
                className="bg-dark-2 rounded p-2 w-full no-ring font-light"
              />
            </div>
            <div>
              <div className="uppercase text-gray-300 text-sm font-medium mb-1.5">
                Description
              </div>
              <textarea className="bg-dark-2 rounded p-2 w-full no-ring font-light" />
            </div>
          </div>
        ) : undefined}
      </div>
    </div>
  );
}

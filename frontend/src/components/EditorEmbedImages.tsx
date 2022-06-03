import { ChevronRightIcon } from "@heroicons/react/outline";
import { useState } from "react";
import { Embed } from "../discord";
import useMessage from "../hooks/useMessage";

interface Props {
  index: number;
  embed: Embed;
}

export default function EditorEmbedImages({ index, embed }: Props) {
  const [collapsed, setCollapsed] = useState(true);
  const [, dispatch] = useMessage();

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
        <div>Images</div>
      </div>
      {!collapsed ? (
        <div className="space-y-4 mt-3">
          <div>
            <div className="uppercase text-gray-300 text-sm font-medium mb-1.5">
              Image URL
            </div>
            <input
              type="url"
              className="bg-dark-2 rounded p-2 w-full no-ring font-light"
              value={embed.image?.url || ""}
              onChange={(e) =>
                dispatch({
                  type: "setEmbedImageUrl",
                  value: e.target.value || undefined,
                  index,
                })
              }
            />
          </div>
          <div>
            <div className="uppercase text-gray-300 text-sm font-medium mb-1.5">
              Thumbnail URL
            </div>
            <input
              type="url"
              className="bg-dark-2 rounded p-2 w-full no-ring font-light"
              value={embed.thumbnail?.url || ""}
              onChange={(e) =>
                dispatch({
                  type: "setEmbedThumbnailUrl",
                  value: e.target.value || undefined,
                  index,
                })
              }
            />
          </div>
        </div>
      ) : undefined}
    </div>
  );
}

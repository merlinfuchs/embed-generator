import { ChevronRightIcon } from "@heroicons/react/outline";
import { useState } from "react";
import { Embed } from "../discord";
import useMessage from "../hooks/useMessage";

interface Props {
  index: number;
  embed: Embed;
}

export default function EditorEmbedAuthor({ index, embed }: Props) {
  const [collapsed, setCollapsed] = useState(false);
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
        <div>Author</div>
      </div>
      {!collapsed ? (
        <div className="space-y-4 mt-3">
          <div>
            <div className="uppercase text-gray-300 text-sm font-medium mb-1.5">
              Author
            </div>
            <input
              type="text"
              className="bg-dark-2 rounded p-2 w-full no-ring font-light"
              value={embed.author?.name || ""}
              onChange={(e) =>
                dispatch({
                  type: "setEmbedAuthorName",
                  value: e.target.value || undefined,
                  index,
                })
              }
            />
          </div>
          <div className="flex space-x-3">
            <div className="flex-auto">
              <div className="uppercase text-gray-300 text-sm font-medium mb-1.5">
                Author URL
              </div>
              <input
                type="url"
                className="bg-dark-2 rounded p-2 w-full no-ring font-light"
                value={embed.author?.url || ""}
                onChange={(e) =>
                  dispatch({
                    type: "setEmbedAuthorUrl",
                    value: e.target.value || undefined,
                    index,
                  })
                }
              />
            </div>
            <div className="flex-auto">
              <div className="uppercase text-gray-300 text-sm font-medium mb-1.5">
                Author Icon URL
              </div>
              <input
                type="url"
                className="bg-dark-2 rounded p-2 w-full no-ring font-light"
                value={embed.author?.icon_url || ""}
                onChange={(e) =>
                  dispatch({
                    type: "setEmbedAuthorIconUrl",
                    value: e.target.value || undefined,
                    index,
                  })
                }
              />
            </div>
          </div>
        </div>
      ) : undefined}
    </div>
  );
}

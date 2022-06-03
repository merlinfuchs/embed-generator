import { ChevronRightIcon } from "@heroicons/react/outline";
import { useState } from "react";
import { Embed } from "../discord";
import useMessage from "../hooks/useMessage";
import ColorPicker from "./ColorPicker";

interface Props {
  index: number;
  embed: Embed;
}

export default function EditorEmbedBody({ index, embed }: Props) {
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
        <div>Body</div>
      </div>
      {!collapsed ? (
        <div className="space-y-4 mt-3">
          <div>
            <div className="uppercase text-gray-300 text-sm font-medium mb-1.5">
              Title
            </div>
            <input
              type="text"
              className="bg-dark-2 rounded p-2 w-full no-ring font-light"
              value={embed.title || ""}
              onChange={(e) =>
                dispatch({
                  type: "setEmbedTitle",
                  value: e.target.value || undefined,
                  index,
                })
              }
            />
          </div>
          <div>
            <div className="uppercase text-gray-300 text-sm font-medium mb-1.5">
              Description
            </div>
            <textarea
              className="bg-dark-2 rounded p-2 w-full no-ring font-light"
              value={embed.description || ""}
              onChange={(e) =>
                dispatch({
                  type: "setEmbedDescription",
                  value: e.target.value || undefined,
                  index,
                })
              }
            />
          </div>
          <div className="flex space-x-3">
            <div className="flex-auto">
              <div className="uppercase text-gray-300 text-sm font-medium mb-1.5">
                URL
              </div>
              <input
                type="text"
                className="bg-dark-2 rounded p-2 w-full no-ring font-light"
                value={embed.url || ""}
                onChange={(e) =>
                  dispatch({
                    type: "setEmbedUrl",
                    value: e.target.value || undefined,
                    index,
                  })
                }
              />
            </div>
            <div className="flex-auto">
              <div className="uppercase text-gray-300 text-sm font-medium mb-1.5">
                Color
              </div>
              <ColorPicker
                value={embed.color}
                onChange={(value) =>
                  dispatch({
                    type: "setEmbedColor",
                    value,
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

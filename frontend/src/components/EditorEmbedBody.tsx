import { ChevronRightIcon } from "@heroicons/react/outline";
import { useState } from "react";
import { Embed } from "../discord/types";
import useMessage from "../hooks/useMessage";
import ColorPicker from "./ColorPicker";
import StyledInput from "./StyledInput";
import StyledTextarea from "./StyledTextarea";

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
          <StyledInput
            label="Title"
            type="text"
            value={embed.title || ""}
            maxLength={256}
            onChange={(value) =>
              dispatch({
                type: "setEmbedTitle",
                value: value || undefined,
                index,
              })
            }
          />
          <StyledTextarea
            label="Description"
            value={embed.description || ""}
            maxLength={4096}
            onChange={(value) =>
              dispatch({
                type: "setEmbedDescription",
                value,
                index,
              })
            }
          />
          <div className="flex space-x-3">
            <StyledInput
              className="flex-auto"
              label="URL"
              type="url"
              value={embed.url || ""}
              onChange={(value) =>
                dispatch({
                  type: "setEmbedUrl",
                  value: value || undefined,
                  index,
                })
              }
            />
            <div>
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

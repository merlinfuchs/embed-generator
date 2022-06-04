import { ChevronRightIcon } from "@heroicons/react/outline";
import { useState } from "react";
import { Embed } from "../discord";
import useMessage from "../hooks/useMessage";
import StyledInput from "./StyledInput";

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
          <StyledInput
            label="Author"
            type="text"
            value={embed.author?.name || ""}
            maxLength={256}
            onChange={(value) =>
              dispatch({
                type: "setEmbedAuthorName",
                value,
                index,
              })
            }
          />
          <div className="flex space-x-3">
            <StyledInput
              className="flex-auto"
              label="Author URL"
              type="url"
              value={embed.author?.url || ""}
              onChange={(value) =>
                dispatch({
                  type: "setEmbedAuthorUrl",
                  value: value || undefined,
                  index,
                })
              }
            />
            <StyledInput
              className="flex-auto"
              label="Author Icon URL"
              type="url"
              value={embed.author?.icon_url || ""}
              onChange={(value) =>
                dispatch({
                  type: "setEmbedAuthorIconUrl",
                  value: value || undefined,
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

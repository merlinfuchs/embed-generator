import { ChevronRightIcon } from "@heroicons/react/outline";
import { ExclamationCircleIcon } from "@heroicons/react/solid";
import { useState } from "react";
import { ZodFormattedError } from "zod";
import { Embed, EmbedAuthor } from "../discord/types";
import useMessage from "../hooks/useMessage";
import StyledInput from "./StyledInput";
import useAutoAnimate from "../hooks/useAutoAnimate";

interface Props {
  index: number;
  embed: Embed;
  errors?: ZodFormattedError<EmbedAuthor>;
}

export default function EditorEmbedAuthor({ index, embed, errors }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [, dispatch] = useMessage();

  const [authorContainer] = useAutoAnimate<HTMLDivElement>();

  return (
    <div ref={authorContainer}>
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
        {!!errors && <ExclamationCircleIcon className="text-red w-5 h-5" />}
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
            errors={errors?.name?._errors}
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
              errors={errors?.url?._errors}
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
              errors={errors?.icon_url?._errors}
            />
          </div>
        </div>
      ) : undefined}
    </div>
  );
}

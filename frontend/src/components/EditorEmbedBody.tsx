import { ChevronRightIcon } from "@heroicons/react/outline";
import { ExclamationCircleIcon } from "@heroicons/react/solid";
import { useState } from "react";
import { ZodFormattedError } from "zod";
import { Embed } from "../discord/types";
import useMessage from "../hooks/useMessage";
import ColorPicker from "./ColorPicker";
import StyledInput from "./StyledInput";
import StyledTextarea from "./StyledTextarea";

import useAutoAnimate from "../hooks/useAutoAnimate";

interface Props {
  index: number;
  embed: Embed;
  errors?: ZodFormattedError<Embed>;
}

export default function EditorEmbedBody({ index, embed, errors }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [, dispatch] = useMessage();

  const [bodyContainer] = useAutoAnimate<HTMLDivElement>();

  return (
    <div ref={bodyContainer}>
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
        {(errors?.title || errors?.description || errors?.url) && (
          <ExclamationCircleIcon className="text-red w-5 h-5" />
        )}
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
            errors={errors?.title?._errors}
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
            errors={errors?.description?._errors}
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
              errors={errors?.url?._errors}
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

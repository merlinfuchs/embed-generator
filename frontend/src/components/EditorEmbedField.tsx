import {
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  DuplicateIcon,
  TrashIcon,
} from "@heroicons/react/outline";
import { ExclamationCircleIcon } from "@heroicons/react/solid";
import { useState } from "react";
import { ZodFormattedError } from "zod";
import { Embed, EmbedField } from "../discord/types";
import useMessage from "../hooks/useMessage";
import StyledInput from "./StyledInput";
import StyledTextarea from "./StyledTextarea";
import useAutoAnimate from "../hooks/useAutoAnimate";

interface Props {
  field: EmbedField;
  index: number;
  embed: Embed;
  embedIndex: number;
  errors?: ZodFormattedError<EmbedField>;
}

export default function EditorEmbedField({
  field,
  index,
  embed,
  embedIndex,
  errors,
}: Props) {
  const [, dispatch] = useMessage();
  const [collapsed, setCollapsed] = useState(false);

  const [fieldContainer] = useAutoAnimate<HTMLDivElement>();

  return (
    <div>
      <div
        className="border border-dark-6 px-3 md:px-4 rounded-md mb-3"
        ref={fieldContainer}
      >
        <div className="flex items-center py-3 overflow-hidden">
          <div
            className="text-medium flex-auto cursor-pointer flex items-center space-x-2 select-none overflow-hidden"
            onClick={() => setCollapsed(!collapsed)}
          >
            <ChevronRightIcon
              className={`h-5 w-5 transition-transform duration-300 ${
                collapsed ? "" : "rotate-90"
              }`}
            />
            <div className="flex-none">Field {index + 1}</div>
            {!!errors && <ExclamationCircleIcon className="text-red w-5 h-5" />}
            {field.name ? (
              <div className="text-gray-500 truncate">- {field.name}</div>
            ) : undefined}
          </div>
          <div className="flex space-x-3 flex-none">
            {index !== 0 && (
              <ChevronUpIcon
                className="h-4 w-4 cursor-pointer"
                onClick={() =>
                  dispatch({ type: "moveEmbedFieldUp", index, embedIndex })
                }
              />
            )}
            {index !== embed.fields.length - 1 && (
              <ChevronDownIcon
                className="h-4 w-4 cursor-pointer"
                onClick={() =>
                  dispatch({ type: "moveEmbedFieldDown", index, embedIndex })
                }
              />
            )}
            <DuplicateIcon
              className="h-4 w-4 cursor-pointer"
              onClick={() =>
                dispatch({ type: "cloneEmbedField", index, embedIndex })
              }
            />
            <TrashIcon
              className="h-4 w-4 cursor-pointer"
              onClick={() =>
                dispatch({ type: "removeEmbedField", index, embedIndex })
              }
            />
          </div>
        </div>
        {!collapsed ? (
          <div className="space-y-4 pb-3">
            <div className="flex space-x-3">
              <StyledInput
                className="flex-auto"
                label="Name"
                type="text"
                value={field.name}
                maxLength={256}
                onChange={(value) =>
                  dispatch({
                    type: "setEmbedFieldName",
                    value: value,
                    index,
                    embedIndex,
                  })
                }
                errors={errors?.name?._errors}
              />
              <div className="flex-none">
                <div className="uppercase text-gray-300 text-sm font-medium mb-1.5">
                  Inline
                </div>
                <div
                  className="bg-dark-2 w-10 h-10 rounded cursor-pointer flex items-center justify-center"
                  onClick={() =>
                    dispatch({
                      type: "setEmbedFieldInline",
                      index,
                      embedIndex,
                      value: !field.inline,
                    })
                  }
                >
                  {!!field.inline && <CheckIcon className="w-8 h-8" />}
                </div>
              </div>
            </div>
            <StyledTextarea
              label="Description"
              value={field.value}
              maxLength={1024}
              onChange={(value) =>
                dispatch({
                  type: "setEmbedFieldValue",
                  value,
                  index,
                  embedIndex,
                })
              }
              errors={errors?.value?._errors}
            />
          </div>
        ) : undefined}
      </div>
    </div>
  );
}

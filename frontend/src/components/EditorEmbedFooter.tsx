import { ChevronRightIcon } from "@heroicons/react/outline";
import { useEffect, useRef, useState } from "react";
import { Embed } from "../discord/types";
import useMessage from "../hooks/useMessage";
import StyledInput from "./StyledInput";
import { parse, formatISO, parseISO, format } from "date-fns";
import { ZodFormattedError } from "zod";
import { ExclamationCircleIcon } from "@heroicons/react/solid";
import useAutoAnimate from "../hooks/useAutoAnimate";

interface Props {
  index: number;
  embed: Embed;
  errors?: ZodFormattedError<Embed>;
}

export default function EditorEmbedFooter({ index, embed, errors }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [, dispatch] = useMessage();

  const [rawTimestamp, setRawTimestamp] = useState("");
  const previousTimestamp = useRef("");

  useEffect(() => {
    if (rawTimestamp) {
      const date = parse(rawTimestamp, "yyyy-MM-dd HH:mm", new Date());
      if (!isNaN(date.getTime())) {
        const value = formatISO(date);
        if (value !== previousTimestamp.current) {
          previousTimestamp.current = value;
          dispatch({ type: "setEmbedTimestamp", index, value });
        }
      }
    } else {
      if (previousTimestamp.current !== "") {
        previousTimestamp.current = "";
        dispatch({ type: "setEmbedTimestamp", index, value: undefined });
      }
    }
  }, [rawTimestamp, index, dispatch]);

  useEffect(() => {
    if (embed.timestamp) {
      const date = parseISO(embed.timestamp);
      if (!isNaN(date.getTime())) {
        setRawTimestamp(format(date, "yyyy-MM-dd HH:mm"));
      }
    } else {
      setRawTimestamp("");
    }
  }, [embed.timestamp]);

  const [footerContainer] = useAutoAnimate<HTMLDivElement>();

  return (
    <div ref={footerContainer}>
      <div
        className="text-medium flex-auto cursor-pointer flex items-center space-x-2 text-gray-300 select-none"
        onClick={() => setCollapsed(!collapsed)}
      >
        <ChevronRightIcon
          className={`h-5 w-5 transition-transform duration-300 ${
            collapsed ? "" : "rotate-90"
          }`}
        />
        <div>Footer</div>
        {(errors?.footer || errors?.timestamp) && (
          <ExclamationCircleIcon className="text-red w-5 h-5" />
        )}
      </div>
      {!collapsed ? (
        <div className="space-y-4 mt-3">
          <StyledInput
            label="Footer"
            type="text"
            value={embed.footer?.text || ""}
            maxLength={2048}
            onChange={(value) =>
              dispatch({
                type: "setEmbedFooterText",
                value: value || undefined,
                index,
              })
            }
            errors={(errors?.footer as any)?.text?._errors}
          />
          <div className="flex space-x-3">
            <StyledInput
              className="flex-auto"
              label="Timestamp"
              type="text"
              value={rawTimestamp}
              onChange={setRawTimestamp}
              inputProps={{ placeholder: "YYYY-MM-DD hh:mm" }}
              errors={errors?.timestamp?._errors}
            />
            <StyledInput
              className="flex-auto"
              label="Footer Icon URL"
              type="url"
              value={embed.footer?.icon_url || ""}
              onChange={(value) =>
                dispatch({
                  type: "setEmbedFooterIconUrl",
                  value: value || undefined,
                  index,
                })
              }
              errors={(errors?.footer as any)?.icon_url?._errors}
            />
          </div>
        </div>
      ) : undefined}
    </div>
  );
}

import { ChevronRightIcon } from "@heroicons/react/outline";
import { useMemo, useState } from "react";
import useMessage from "../hooks/useMessage";
import useToken from "../hooks/useToken";
import EditorButton from "./EditorButton";
import EditorEmbed from "./EditorEmbed";
import StyledInput from "./StyledInput";
import StyledTextarea from "./StyledTextarea";

export default function Editor() {
  const [msg, dispatchMsg] = useMessage();
  const [token] = useToken();

  const [embedsCollapsed, setEmbedsCollapsed] = useState(false);
  const [componentsCollapsed, setComponentsCollapsed] = useState(false);

  const embedCharacters = useMemo(
    () =>
      msg.embeds
        .map(
          (e) =>
            (e.title?.length || 0) +
            (e.description?.length || 0) +
            (e.author?.name.length || 0) +
            (e.footer?.text.length || 0) +
            e.fields
              .map((f) => f.name.length + f.value.length)
              .reduce((a, b) => a + b, 0)
        )
        .reduce((a, b) => a + b, 0),
    [msg.embeds]
  );

  return (
    <div className="space-y-5">
      <div className="flex space-x-3">
        <StyledInput
          label="Username"
          type="text"
          className="flex-auto"
          maxLength={80}
          value={msg.username || ""}
          onChange={(value) => dispatchMsg({ type: "setUsername", value })}
        />
        <StyledInput
          label="Avatar URL"
          type="url"
          className="flex-auto"
          value={msg.avatar_url || ""}
          onChange={(value) =>
            dispatchMsg({ type: "setAvatarUrl", value: value })
          }
        />
      </div>
      <StyledTextarea
        label="Content"
        value={msg.content || ""}
        maxLength={2000}
        onChange={(value) => dispatchMsg({ type: "setContent", value })}
      />
      <div>
        <div className="uppercase text-gray-300 text-sm font-medium mb-1.5">
          Files
        </div>
        <input
          type="file"
          multiple
          className="bg-dark-2 rounded p-2 w-full no-ring font-light"
        />
      </div>
      <div>
        <div
          className="flex-auto cursor-pointer flex items-center space-x-2 text-gray-300 select-none mb-2"
          onClick={() => setEmbedsCollapsed(!embedsCollapsed)}
        >
          <ChevronRightIcon
            className={`h-5 w-5 transition-transform duration-300 ${
              embedsCollapsed ? "" : "rotate-90"
            }`}
          />
          <div className="flex space-x-2 items-center">
            <div className="text-lg font-medium">Embeds</div>
            <div
              className={`italic font-light text-sm ${
                embedCharacters < 6000 ? "text-gray-400" : "text-red"
              }`}
            >
              {embedCharacters} / 6000
            </div>
          </div>
        </div>
        {!embedsCollapsed && (
          <>
            {msg.embeds.map((embed, i) => (
              <EditorEmbed index={i} embed={embed} key={embed.id} />
            ))}
            <div className="space-x-3 mt-3">
              {msg.embeds.length < 10 ? (
                <button
                  className="bg-blurple px-3 py-2 rounded transition-colors hover:bg-blurple-dark"
                  onClick={() => dispatchMsg({ type: "addEmbed" })}
                >
                  Add Embed
                </button>
              ) : (
                <button
                  disabled
                  className="bg-dark-3 px-3 py-2 rounded transition-colors cursor-not-allowed text-gray-300"
                >
                  Add Embed
                </button>
              )}
              <button
                className="px-3 py-2 rounded border-2 border-red hover:bg-red transition-colors"
                onClick={() => dispatchMsg({ type: "clearEmbeds" })}
              >
                Clear Embeds
              </button>
            </div>
          </>
        )}
      </div>
      {!!token && (
        <div>
          <div
            className="flex-auto cursor-pointer flex items-center space-x-2 text-gray-300 select-none mb-2"
            onClick={() => setComponentsCollapsed(!componentsCollapsed)}
          >
            <ChevronRightIcon
              className={`h-5 w-5 transition-transform duration-300 ${
                componentsCollapsed ? "" : "rotate-90"
              }`}
            />
            <div className="text-lg font-medium">Buttons</div>
          </div>
          {!componentsCollapsed && (
            <>
              {msg.components.flatMap((comp, i) =>
                comp.components.map((button, i) => (
                  <EditorButton index={i} button={button} key={button.id} />
                ))
              )}
              <div className="space-x-3 mt-3">
                {(msg.components[0]?.components?.length || 0) < 5 ? (
                  <button
                    className="bg-blurple px-3 py-2 rounded transition-colors hover:bg-blurple-dark"
                    onClick={() => dispatchMsg({ type: "addButton" })}
                  >
                    Add Button
                  </button>
                ) : (
                  <button
                    disabled
                    className="bg-dark-3 px-3 py-2 rounded transition-colors cursor-not-allowed text-gray-300"
                  >
                    Add Button
                  </button>
                )}
                <button
                  className="px-3 py-2 rounded border-2 border-red hover:bg-red transition-colors"
                  onClick={() => dispatchMsg({ type: "clearButtons" })}
                >
                  Clear Buttons
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

import { ChevronRightIcon } from "@heroicons/react/outline";
import { useState } from "react";
import useMessage from "../hooks/useMessage";
import EditorEmbed from "./EditorEmbed";
import StyledInput from "./StyledInput";
import StyledTextarea from "./StyledTextarea";

export default function Editor() {
  const [msg, dispatchMsg] = useMessage();

  const [embedsCollapsed, setEmbedsCollapsed] = useState(false);
  const [componentsCollapsed, setComponentsCollapsed] = useState(false);

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
          <div className="text-lg font-medium">Embeds</div>
        </div>
        {!embedsCollapsed && (
          <>
            {msg.embeds.map((embed, i) => (
              <EditorEmbed index={i} embed={embed} key={embed.id} />
            ))}
            <div className="space-x-3 mt-3">
              <button
                className="bg-blurple px-3 py-2 rounded transition-colors hover:bg-blurple-dark"
                onClick={() => dispatchMsg({ type: "addEmbed" })}
              >
                Add Embed
              </button>
              <button
                className="px-3 py-2 rounded border border-red hover:bg-red transition-colors"
                onClick={() => dispatchMsg({ type: "clearEmbeds" })}
              >
                Clear Embeds
              </button>
            </div>
          </>
        )}
      </div>
      {/*<div>
        <div
          className="flex-auto cursor-pointer flex items-center space-x-2 text-gray-300 select-none mb-2"
          onClick={() => setComponentsCollapsed(!componentsCollapsed)}
        >
          <ChevronRightIcon
            className={`h-5 w-5 transition-transform duration-300 ${
              componentsCollapsed ? "" : "rotate-90"
            }`}
          />
          <div className="text-lg font-medium">Components</div>
        </div>
        {!componentsCollapsed && (
          <>
            <div className="space-x-3 mt-3">
              <button
                className="bg-blurple px-3 py-2 rounded transition-colors hover:bg-blurple-dark"
                onClick={() => dispatchMsg({ type: "addEmbed" })}
              >
                Add Button
              </button>
              <button
                className="px-3 py-2 rounded border border-red hover:bg-red transition-colors"
                onClick={() => dispatchMsg({ type: "clearEmbeds" })}
              >
                Clear Buttons
              </button>
            </div>
          </>
        )}
      </div>*/}
    </div>
  );
}

import useMessage from "../hooks/useMessage";
import EditorEmbed from "./EditorEmbed";

export default function Editor() {
  const [msg, dispatchMsg] = useMessage();

  return (
    <div className="space-y-5">
      <div className="flex space-x-3">
        <div className="flex-auto">
          <div className="uppercase text-gray-300 text-sm font-medium mb-1.5">
            Username
          </div>
          <input
            type="text"
            className="bg-dark-2 rounded p-2 w-full no-ring font-light"
            value={msg.username || ""}
            onChange={(e) =>
              dispatchMsg({ type: "setUsername", value: e.target.value })
            }
          />
        </div>
        <div className="flex-auto">
          <div className="uppercase text-gray-300 text-sm font-medium mb-1.5">
            Avatar URL
          </div>
          <input
            type="text"
            className="bg-dark-2 rounded p-2 w-full no-ring font-light"
            value={msg.avatar_url || ""}
            onChange={(e) =>
              dispatchMsg({ type: "setAvatarUrl", value: e.target.value })
            }
          />
        </div>
      </div>
      <div>
        <div className="uppercase text-gray-300 text-sm font-medium mb-1.5">
          Content
        </div>
        <textarea
          className="bg-dark-2 rounded p-2 w-full no-ring font-light"
          value={msg.content || ""}
          onChange={(e) =>
            dispatchMsg({ type: "setContent", value: e.target.value })
          }
        />
      </div>
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
      </div>
    </div>
  );
}

import { useMemo, useRef, useState } from "react";
import MessagePreview from "./MessagePreview";
import EditorInput from "./EditorInput";
import { Message } from "../discord/schema";
import { getUniqueId } from "../util";
import ColorPicker from "./ColorPicker";
import { useEmbedLinkCreateMutation } from "../api/mutations";
import { useToasts } from "../util/toasts";
import { colorIntToHex } from "../util/discord";
import CheckBox from "./CheckBox";

export default function ToolsEmbedLinks() {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState<number | undefined>(undefined);
  const [imageUrl, setImageUrl] = useState("");

  const [providerName, setProviderName] = useState("");
  const [providerUrl, setProviderUrl] = useState("");

  const [authorName, setAuthorName] = useState("");
  const [authorUrl, setAuthorUrl] = useState("");

  const [twitterCard, setTwitterCard] = useState(true);

  const previewMsg = useMemo(() => {
    return {
      content: "https://message.style/e/123",
      tts: false,
      username: "Some User",
      embeds: [
        {
          id: getUniqueId(),
          url: url || undefined,
          title: title || undefined,
          description: description || undefined,
          color: color,
          author: !!authorName
            ? {
                name: authorName,
                url: authorUrl || undefined,
              }
            : undefined,
          provider: !!providerName
            ? {
                name: providerName,
                url: providerUrl || undefined,
              }
            : undefined,
          fields: [],
          thumbnail:
            !!imageUrl && !twitterCard
              ? {
                  url: imageUrl,
                }
              : undefined,
          image:
            !!imageUrl && twitterCard
              ? {
                  url: imageUrl,
                }
              : undefined,
        },
      ],
      components: [],
      actions: {},
    } satisfies Message;
  }, [
    title,
    url,
    description,
    color,
    imageUrl,
    providerName,
    providerUrl,
    authorName,
    authorUrl,
    twitterCard,
  ]);

  const [newLinkUrl, setNewLinkUrl] = useState("");

  const embedLinkCreateMutation = useEmbedLinkCreateMutation();
  const createToast = useToasts((s) => s.create);

  function createEmbedLink() {
    if (!url) {
      createToast({
        title: "Some required fields are missing",
        message:
          "Please fill at least the  URL field before creating the embed link",
        type: "error",
      });
      return;
    }

    embedLinkCreateMutation.mutate(
      {
        url,
        theme_color: color ? colorIntToHex(color) : null,
        og_title: title,
        og_description: description,
        og_image: imageUrl,
        og_site_name: providerName,
        oe_type: null,
        oe_author_name: authorName,
        oe_author_url: authorUrl,
        oe_provider_name: providerName,
        oe_provider_url: providerUrl,
        tw_card: twitterCard ? "summary_large_image" : null,
      },
      {
        onSuccess: (res) => {
          if (res.success) {
            setNewLinkUrl(res.data.url);
          } else {
            createToast({
              title: "Failed to create embed link",
              message: res.error.message,
              type: "error",
            });
          }
        },
      }
    );
  }

  const inputRef = useRef<HTMLInputElement>(null);

  function copy() {
    if (inputRef.current) {
      inputRef.current.select();
      inputRef.current.setSelectionRange(0, 99999);
      document.execCommand("copy");
      createToast({
        title: "Copied URL",
        message: "The URL has been copied to your clipboard",
        type: "success",
      });
    }
  }

  return (
    <div className="flex flex-col lg:flex-row h-full flex-auto w-full space-y-10 lg:space-y-0 lg:space-x-10">
      {newLinkUrl ? (
        <div className="w-full lg:w-1/2 space-y-5">
          <div className="flex items-center">
            <input
              type="text"
              className="bg-dark-2 rounded-l px-3 py-2 text-gray-100 w-full focus:outline-none"
              value={newLinkUrl}
              readOnly
              ref={inputRef}
            />
            <button
              className="px-3 py-2 rounded-r bg-blurple hover:bg-blurple-dark text-white flex-none"
              onClick={copy}
            >
              Copy Link
            </button>
          </div>
          <div className="flex">
            <button
              className="px-3 py-2 rounded border-2 border-dark-7 hover:bg-dark-6 cursor-pointer text-white"
              onClick={() => setNewLinkUrl("")}
            >
              Create New
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full lg:w-1/2 space-y-3">
          <EditorInput
            label="URL"
            description="The URL that users will be redirected to when clicking your embed link."
            value={url}
            onChange={setUrl}
            type="url"
          />
          <div className="flex space-x-3">
            <EditorInput
              label="Title"
              value={title}
              onChange={setTitle}
              maxLength={256}
            />
            <div>
              <div className="uppercase text-gray-300 text-sm font-medium mb-1.5">
                Color
              </div>
              <ColorPicker value={color} onChange={setColor} />
            </div>
          </div>
          <div className="flex space-x-3">
            <EditorInput
              label="Provider"
              value={providerName}
              onChange={setProviderName}
              maxLength={256}
            />
            <EditorInput
              label="Provider URL"
              value={providerUrl}
              onChange={setProviderUrl}
            />
          </div>
          <div className="flex space-x-3">
            <EditorInput
              label="Author"
              value={authorName}
              onChange={setAuthorName}
              maxLength={256}
            />
            <EditorInput
              label="Author URL"
              value={authorUrl}
              onChange={setAuthorUrl}
            />
          </div>
          <EditorInput
            label="Description"
            value={description}
            onChange={setDescription}
            type="textarea"
            maxLength={4096}
          />
          <div className="flex space-x-3">
            <div>
              <div className="uppercase text-gray-300 text-sm font-medium mb-1.5">
                Large
              </div>
              <CheckBox
                checked={!twitterCard}
                onChange={setTwitterCard}
                height={10}
              />
            </div>
            <EditorInput
              label="Image URL"
              value={imageUrl}
              onChange={setImageUrl}
              type="url"
              imageUpload={true}
              className="w-full"
            />
          </div>
          <div className="flex justify-end pt-3">
            <button
              className="px-3 py-2 rounded text-white bg-blurple hover:bg-blurple-dark"
              onClick={createEmbedLink}
            >
              Create Link
            </button>
          </div>
        </div>
      )}
      <div className="w-full lg:w-1/2">
        <MessagePreview msg={previewMsg} />
      </div>
    </div>
  );
}

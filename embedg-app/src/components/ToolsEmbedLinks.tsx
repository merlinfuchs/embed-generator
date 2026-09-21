import { useMemo, useRef, useState } from "react";
import MessagePreview from "./MessagePreview";
import EditorInput from "./EditorInput";
import type { Message } from "../discord/schema";
import { getUniqueId } from "../util";
import ColorPicker from "./ColorPicker";
import { useEmbedLinkCreateMutation } from "../api/mutations";
import { useToasts } from "../util/toasts";
import { colorIntToHex } from "../util/discord";
import CheckBox from "./CheckBox";
import Collapsable from "./Collapsable";
import clsx from "clsx";
import { PADDED } from "./editorCard";
import ComponentEmbedEditor from "./ComponentEmbedEditor";
import {
  componentEmbedPayload,
  useComponentEmbedContainer,
} from "../state/componentEmbed";

/** Subscribes to the component embed on its own, so typing in the editor
 * doesn't re-render the whole tool. */
function ComponentEmbedPreview({ msg }: { msg: Message }) {
  const container = useComponentEmbedContainer();

  return (
    <MessagePreview msg={msg} unfurledComponent={container ?? undefined} />
  );
}

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

  const [componentEmbed, setComponentEmbed] = useState(false);
  const previewEmbedId = useMemo(getUniqueId, []);

  // What the fallback preview is built from, and what Discord shows when
  // there is no custom component.
  const fallbackEmbed = {
    id: previewEmbedId,
    url: url || undefined,
    title: title || undefined,
    description: description || undefined,
    color: color,
    author: authorName
      ? { name: authorName, url: authorUrl || undefined }
      : undefined,
    provider: providerName
      ? { name: providerName, url: providerUrl || undefined }
      : undefined,
    fields: [],
    thumbnail: imageUrl && !twitterCard ? { url: imageUrl } : undefined,
    image: imageUrl && twitterCard ? { url: imageUrl } : undefined,
  };

  const previewMsg = {
    content: "https://message.style/e/123",
    tts: false,
    username: "Some User",
    embeds: componentEmbed ? [] : [fallbackEmbed],
    components: [],
    actions: {},
  } satisfies Message;

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

    if (componentEmbed && !title && !description) {
      createToast({
        title: "The fallback preview is missing",
        message:
          "Add a title or description for Discord to fall back on and for platforms that don't render custom components",
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
        component_embed: componentEmbed ? componentEmbedPayload() : null,
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
      },
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
              className="bg-ink-900 rounded-l-lg px-3 py-2 text-mist-100 w-full focus:outline-none"
              value={newLinkUrl}
              readOnly
              ref={inputRef}
            />
            <button
              className="px-3 py-2 rounded-r-lg bg-azure-500 hover:bg-azure-400 text-white flex-none"
              onClick={copy}
            >
              Copy Link
            </button>
          </div>
          <div className="flex">
            <button
              className="px-3 py-2 rounded-lg border-2 border-white/15 hover:bg-white/5 hover:border-white/30 transition-colors cursor-pointer text-white"
              onClick={() => setNewLinkUrl("")}
            >
              Create New
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full lg:w-1/2 space-y-5">
          <EditorInput
            label="URL"
            description="The URL that users will be redirected to when clicking your embed link."
            value={url}
            onChange={setUrl}
            type="url"
          />
          <Collapsable
            id="embedLink.preview"
            title={componentEmbed ? "Fallback Preview" : "Preview"}
            size="large"
            extra={
              componentEmbed ? (
                <div className="text-sm italic font-light text-mist-400">
                  everywhere but Discord
                </div>
              ) : undefined
            }
          >
            <div className={clsx(PADDED, "space-y-3")}>
              <div className="flex space-x-3">
                <EditorInput
                  label="Title"
                  value={title}
                  onChange={setTitle}
                  maxLength={256}
                />
                <div>
                  <div className="uppercase text-mist-300 text-sm font-medium mb-1.5">
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
                  <div className="uppercase text-mist-300 text-sm font-medium mb-1.5">
                    Large
                  </div>
                  <CheckBox
                    label="Large"
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
            </div>
          </Collapsable>
          <Collapsable
            id="embedLink.customComponent"
            title="Custom Component"
            size="large"
            extra={
              <div className="text-sm italic font-light text-mist-400">
                Discord only
              </div>
            }
            buttons={
              <CheckBox
                label="Custom Component"
                checked={componentEmbed}
                onChange={setComponentEmbed}
              />
            }
          >
            {componentEmbed ? (
              <ComponentEmbedEditor />
            ) : (
              <div className={clsx(PADDED, "text-sm font-light text-mist-400")}>
                Replace the Discord preview with components: markdown, images,
                galleries and link buttons.
              </div>
            )}
          </Collapsable>
          <div className="flex justify-end">
            <button
              className="px-3 py-2 rounded-lg text-white bg-azure-500 hover:bg-azure-400"
              onClick={createEmbedLink}
            >
              Create Link
            </button>
          </div>
        </div>
      )}
      <div className="w-full lg:w-1/2 space-y-3">
        <div className="flex items-center space-x-2">
          <div className="uppercase text-mist-300 text-sm font-medium">
            Discord Preview
          </div>
          {componentEmbed && (
            <div className="text-sm italic font-light text-mist-400">
              other platforms get the fallback
            </div>
          )}
        </div>
        {componentEmbed ? (
          <ComponentEmbedPreview msg={previewMsg} />
        ) : (
          <MessagePreview msg={previewMsg} />
        )}
      </div>
    </div>
  );
}

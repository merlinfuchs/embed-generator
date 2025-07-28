import { shallow } from "zustand/shallow";
import { useCurrentMessageStore } from "../state/message";
import Collapsable from "./Collapsable";
import EditorInput from "./EditorInput";

interface Props {
  embedIndex: number;
  embedId: number;
}

export default function EditorEmbedAuthor({ embedIndex, embedId }: Props) {
  const [authorName, setAuthorName] = useCurrentMessageStore(
    (state) => [
      state.embeds[embedIndex]?.author?.name,
      state.setEmbedAuthorName,
    ],
    shallow
  );

  const [authorIconUrl, setAuthorIconUrl] = useCurrentMessageStore(
    (state) => [
      state.embeds[embedIndex]?.author?.icon_url,
      state.setEmbedAuthorIconUrl,
    ],
    shallow
  );

  const [authorUrl, setAuthorUrl] = useCurrentMessageStore(
    (state) => [state.embeds[embedIndex]?.author?.url, state.setEmbedAuthorUrl],
    shallow
  );

  console.log("render author", embedIndex);

  return (
    <Collapsable
      title="Author"
      id={`embeds.${embedId}.author`}
      validationPathPrefix={`embeds.${embedIndex}.author`}
    >
      <div className="space-y-3">
        <EditorInput
          label="Author"
          value={authorName || ""}
          onChange={(v) => setAuthorName(embedIndex, v)}
          maxLength={256}
          validationPath={`embeds.${embedIndex}.author.name`}
        />
        <div className="flex space-x-3">
          <EditorInput
            type="url"
            label="Author URL"
            value={authorUrl || ""}
            onChange={(v) => setAuthorUrl(embedIndex, v || undefined)}
            className="w-1/2"
            validationPath={`embeds.${embedIndex}.author.url`}
          />
          <EditorInput
            type="url"
            label="Author Icon URL"
            value={authorIconUrl || ""}
            onChange={(v) => setAuthorIconUrl(embedIndex, v || undefined)}
            className="w-1/2"
            validationPath={`embeds.${embedIndex}.author.icon_url`}
            imageUpload={true}
          />
        </div>
      </div>
    </Collapsable>
  );
}

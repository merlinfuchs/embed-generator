import { shallow } from "zustand/shallow";
import { useCurrentMessageStore } from "../state/message";
import Collapsable from "./Collapsable";
import EditorInput from "./EditorInput";

interface Props {
  embedIndex: number;
  embedId: number;
}

export default function EditorEmbedImages({ embedIndex, embedId }: Props) {
  const [imageUrl, setImageUrl] = useCurrentMessageStore(
    (state) => [state.embeds[embedIndex]?.image?.url, state.setEmbedImageUrl],
    shallow
  );

  const [thumbnailUrl, setThumbnailUrl] = useCurrentMessageStore(
    (state) => [
      state.embeds[embedIndex]?.thumbnail?.url,
      state.setEmbedThumbnailUrl,
    ],
    shallow
  );

  return (
    <Collapsable
      title="Images"
      id={`embeds.${embedId}.images`}
      validationPathPrefix={[
        `embeds.${embedIndex}.image`,
        `embeds.${embedIndex}.thumbnail`,
      ]}
    >
      <div className="space-y-3">
        <EditorInput
          label="Image URL"
          type="url"
          value={imageUrl || ""}
          onChange={(v) => setImageUrl(embedIndex, v || undefined)}
          validationPath={`embeds.${embedIndex}.image.url`}
          imageUpload={true}
        />
        <EditorInput
          label="Thumbnail URL"
          type="url"
          value={thumbnailUrl || ""}
          onChange={(v) => setThumbnailUrl(embedIndex, v || undefined)}
          validationPath={`embeds.${embedIndex}.thumbnail.url`}
          imageUpload={true}
        />
      </div>
    </Collapsable>
  );
}

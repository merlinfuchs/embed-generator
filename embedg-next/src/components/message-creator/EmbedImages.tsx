import { useShallow } from "zustand/react/shallow";
import CollapsibleSection from "./CollapsibleSection";
import { useCurrentMessageStore } from "@/lib/state/message";
import MessageInput from "./MessageInput";

export default function EmbedImages({
  embedId,
  embedIndex,
}: {
  embedId: number;
  embedIndex: number;
}) {
  const [imageUrl, setImageUrl] = useCurrentMessageStore(
    useShallow((state) => [
      state.embeds[embedIndex]?.image?.url,
      state.setEmbedImageUrl,
    ])
  );
  const [thumbnailUrl, setThumbnailUrl] = useCurrentMessageStore(
    useShallow((state) => [
      state.embeds[embedIndex]?.thumbnail?.url,
      state.setEmbedThumbnailUrl,
    ])
  );

  return (
    <CollapsibleSection
      title="Images"
      size="md"
      valiationPathPrefix={[
        `embeds.${embedIndex}.image`,
        `embeds.${embedIndex}.thumbnail`,
      ]}
      className="space-y-3"
    >
      <MessageInput
        type="url"
        label="Image URL"
        value={imageUrl || ""}
        onChange={(v) => setImageUrl(embedIndex, v || undefined)}
        validationPath={`embeds.${embedIndex}.image.url`}
      />
      <MessageInput
        type="url"
        label="Thumbnail URL"
        value={thumbnailUrl || ""}
        onChange={(v) => setThumbnailUrl(embedIndex, v || undefined)}
        validationPath={`embeds.${embedIndex}.thumbnail.url`}
      />
    </CollapsibleSection>
  );
}

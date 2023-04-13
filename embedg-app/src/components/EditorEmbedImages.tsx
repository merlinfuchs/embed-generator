import { shallow } from "zustand/shallow";
import {
  embedAuthorIconUrlSChema as embedAuthorIconUrlSchema,
  embedAuthorNameSchema,
  embedAuthorUrlSchema,
  embedImageUrlSchema,
  embedThumbnailUrlSchema,
} from "../discord/schema";
import { useCurrentMessageStore } from "../state/message";
import Collapsable from "./Collapsable";
import EditorInput from "./EditorInput";
import ValidationError from "./ValidationError";

interface Props {
  embedIndex: number;
}

export default function EditorEmbedImages({ embedIndex }: Props) {
  const embedId = useCurrentMessageStore(
    (state) => state.embeds[embedIndex].id
  );

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
    <Collapsable title="Images" id={`embeds.${embedId}.images`}>
      <div className="space-y-3">
        <EditorInput
          label="Image URL"
          type="url"
          value={imageUrl || ""}
          onChange={(v) => setImageUrl(embedIndex, v || undefined)}
        >
          <ValidationError schema={embedImageUrlSchema} value={imageUrl} />
        </EditorInput>
        <EditorInput
          label="Thumbnail URL"
          type="url"
          value={thumbnailUrl || ""}
          onChange={(v) => setThumbnailUrl(embedIndex, v || undefined)}
        >
          <ValidationError
            schema={embedThumbnailUrlSchema}
            value={thumbnailUrl}
          />
        </EditorInput>
      </div>
    </Collapsable>
  );
}

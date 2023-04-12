import { shallow } from "zustand/shallow";
import {
  embedAuthorIconUrlSChema as embedAuthorIconUrlSchema,
  embedAuthorNameSchema,
  embedAuthorUrlSchema,
} from "../discord/schema";
import { useCurrentMessageStore } from "../state/message";
import Collapsable from "./Collapsable";
import EditorInput from "./EditorInput";
import ValidationError from "./ValidationError";

interface Props {
  embedIndex: number;
}

export default function EditorEmbedAuthor({ embedIndex }: Props) {
  const embedId = useCurrentMessageStore(
    (state) => state.embeds[embedIndex].id
  );

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

  return (
    <Collapsable title="Author" id={`embeds.${embedId}.author`}>
      <div className="space-y-3">
        <EditorInput
          label="Author"
          value={authorName || ""}
          onChange={(v) => setAuthorName(embedIndex, v || undefined)}
          maxLength={80}
        >
          <ValidationError schema={embedAuthorNameSchema} value={authorName} />
        </EditorInput>
        <div className="flex space-x-3">
          <EditorInput
            type="url"
            label="Author URL"
            value={authorUrl || ""}
            onChange={(v) => setAuthorUrl(embedIndex, v || undefined)}
            className="w-1/2"
          >
            <ValidationError schema={embedAuthorUrlSchema} value={authorName} />
          </EditorInput>
          <EditorInput
            type="url"
            label="Author Icon URL"
            value={authorIconUrl || ""}
            onChange={(v) => setAuthorIconUrl(embedIndex, v || undefined)}
            className="w-1/2"
          >
            <ValidationError
              schema={embedAuthorIconUrlSchema}
              value={authorName}
            />
          </EditorInput>
        </div>
      </div>
    </Collapsable>
  );
}

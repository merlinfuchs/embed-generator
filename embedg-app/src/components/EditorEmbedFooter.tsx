import { shallow } from "zustand/shallow";
import {
  embedAuthorIconUrlSChema as embedAuthorIconUrlSchema,
  embedAuthorNameSchema,
  embedAuthorUrlSchema,
  embedFooterIconUrlSchema,
  embedFooterTextSchema,
  embedTimestampSchema,
} from "../discord/schema";
import { useCurrentMessageStore } from "../state/message";
import Collapsable from "./Collapsable";
import EditorInput from "./EditorInput";
import ValidationError from "./ValidationError";

interface Props {
  embedIndex: number;
}

export default function EditorEmbedFooter({ embedIndex }: Props) {
  const embedId = useCurrentMessageStore(
    (state) => state.embeds[embedIndex].id
  );

  const [footerText, setFooterText] = useCurrentMessageStore(
    (state) => [
      state.embeds[embedIndex]?.footer?.text,
      state.setEmbedFooterText,
    ],
    shallow
  );

  const [footerIconUrl, setFooterIconUrl] = useCurrentMessageStore(
    (state) => [
      state.embeds[embedIndex]?.footer?.icon_url,
      state.setEmbedFooterIconUrl,
    ],
    shallow
  );

  const [timestamp, setTimestamp] = useCurrentMessageStore(
    (state) => [state.embeds[embedIndex]?.timestamp, state.setEmbedTimestamp],
    shallow
  );

  return (
    <Collapsable title="Footer" id={`embeds.${embedId}.footer`}>
      <div className="space-y-3">
        <EditorInput
          label="Footer"
          value={footerText || ""}
          onChange={(v) => setFooterText(embedIndex, v || undefined)}
          maxLength={80}
        >
          <ValidationError schema={embedFooterTextSchema} value={footerText} />
        </EditorInput>
        <div className="flex space-x-3">
          <EditorInput
            type="url"
            label="Footer Icon URL"
            value={footerIconUrl || ""}
            onChange={(v) => setFooterIconUrl(embedIndex, v || undefined)}
            className="w-1/2"
          >
            <ValidationError
              schema={embedFooterIconUrlSchema}
              value={footerIconUrl}
            />
          </EditorInput>
          <EditorInput
            type="url"
            label="Author Icon URL"
            value={timestamp || ""}
            onChange={(v) => setTimestamp(embedIndex, v || undefined)}
            className="w-1/2"
          >
            <ValidationError schema={embedTimestampSchema} value={timestamp} />
          </EditorInput>
        </div>
      </div>
    </Collapsable>
  );
}

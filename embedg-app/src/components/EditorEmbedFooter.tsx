import { shallow } from "zustand/shallow";
import { useCurrentMessageStore } from "../state/message";
import Collapsable from "./Collapsable";
import EditorInput from "./EditorInput";

interface Props {
  embedIndex: number;
  embedId: number;
}

export default function EditorEmbedFooter({ embedIndex, embedId }: Props) {
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

  console.log("render footer", embedIndex);

  return (
    <Collapsable
      title="Footer"
      id={`embeds.${embedId}.footer`}
      valiationPathPrefix={[
        `embeds.${embedIndex}.footer`,
        `embeds.${embedIndex}.timestamp`,
      ]}
    >
      <div className="space-y-3">
        <EditorInput
          label="Footer"
          value={footerText || ""}
          onChange={(v) => setFooterText(embedIndex, v || undefined)}
          maxLength={2048}
          validationPath={`embeds.${embedIndex}.footer.text`}
        />
        <div className="flex space-x-3">
          <EditorInput
            type="url"
            label="Footer Icon URL"
            value={footerIconUrl || ""}
            onChange={(v) => setFooterIconUrl(embedIndex, v || undefined)}
            className="w-1/2"
            validationPath={`embeds.${embedIndex}.footer.icon_url`}
          />
          <EditorInput
            type="url"
            label="Timestamp"
            value={timestamp || ""}
            onChange={(v) => setTimestamp(embedIndex, v || undefined)}
            className="w-1/2"
            validationPath={`embeds.${embedIndex}.timestamp`}
          />
        </div>
      </div>
    </Collapsable>
  );
}

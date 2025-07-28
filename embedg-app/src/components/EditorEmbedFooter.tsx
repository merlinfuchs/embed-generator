import { shallow } from "zustand/shallow";
import { useCurrentMessageStore } from "../state/message";
import Collapsable from "./Collapsable";
import EditorInput from "./EditorInput";
import DateTimePicker from "./DateTimePicker";

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
      validationPathPrefix={[
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
        <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3">
          <EditorInput
            type="url"
            label="Footer Icon URL"
            value={footerIconUrl || ""}
            onChange={(v) => setFooterIconUrl(embedIndex, v || undefined)}
            className="md:w-1/2"
            validationPath={`embeds.${embedIndex}.footer.icon_url`}
            imageUpload={true}
          />
          <div className="md:w-1/2">
            <div className="mb-1.5 flex">
              <div className="uppercase text-gray-300 text-sm font-medium">
                Timestamp
              </div>
            </div>
            <DateTimePicker
              onChange={(v) => setTimestamp(embedIndex, v)}
              value={timestamp}
              clearable={true}
            />
          </div>
        </div>
      </div>
    </Collapsable>
  );
}

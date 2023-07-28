import { shallow } from "zustand/shallow";
import { useCurrentMessageStore } from "../state/message";
import Collapsable from "./Collapsable";
import EditorInput from "./EditorInput";
import DateTimePicker from "react-datetime-picker";
import "react-datetime-picker/dist/DateTimePicker.css";
import "react-calendar/dist/Calendar.css";
import "react-clock/dist/Clock.css";
import "./DateTimePicker.css";

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
        <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3">
          <EditorInput
            type="url"
            label="Footer Icon URL"
            value={footerIconUrl || ""}
            onChange={(v) => setFooterIconUrl(embedIndex, v || undefined)}
            className="md:w-1/2"
            validationPath={`embeds.${embedIndex}.footer.icon_url`}
          />
          <div className="md:w-1/2">
            <div className="mb-1.5 flex">
              <div className="uppercase text-gray-300 text-sm font-medium">
                Timestamp
              </div>
            </div>
            <DateTimePicker
              onChange={(v) => setTimestamp(embedIndex, v?.toISOString())}
              value={timestamp}
            />
          </div>
        </div>
      </div>
    </Collapsable>
  );
}

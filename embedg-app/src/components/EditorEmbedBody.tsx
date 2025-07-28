import { shallow } from "zustand/shallow";
import { useCurrentMessageStore } from "../state/message";
import Collapsable from "./Collapsable";
import ColorPicker from "./ColorPicker";
import EditorInput from "./EditorInput";
import ValidationError from "./ValidationError";

interface Props {
  embedIndex: number;
  embedId: number;
}

export default function EditorEmbedBody({ embedIndex, embedId }: Props) {
  const [description, setDescription] = useCurrentMessageStore(
    (state) => [
      state.embeds[embedIndex]?.description,
      state.setEmbedDescription,
    ],
    shallow
  );
  const [title, setTitle] = useCurrentMessageStore(
    (state) => [state.embeds[embedIndex]?.title, state.setEmbedTitle],
    shallow
  );
  const [url, setUrl] = useCurrentMessageStore(
    (state) => [state.embeds[embedIndex]?.url, state.setEmbedUrl],
    shallow
  );

  const [color, setColor] = useCurrentMessageStore(
    (state) => [state.embeds[embedIndex]?.color, state.setEmbedColor],
    shallow
  );

  console.log("render body", embedIndex);

  return (
    <Collapsable
      id={`embeds.${embedId}.content`}
      title="Body"
      validationPathPrefix={[
        `embeds.${embedIndex}.title`,
        `embeds.${embedIndex}.description`,
        `embeds.${embedIndex}.url`,
        `embeds.${embedIndex}.color`,
      ]}
    >
      <div className="space-y-3">
        <EditorInput
          label="Title"
          value={title || ""}
          onChange={(v) => setTitle(embedIndex, v || undefined)}
          maxLength={256}
          validationPath={`embeds.${embedIndex}.title`}
        />
        <EditorInput
          type="textarea"
          label="Description"
          value={description || ""}
          onChange={(v) => setDescription(embedIndex, v || undefined)}
          maxLength={4096}
          validationPath={`embeds.${embedIndex}.description`}
          controls={true}
        />
        <div className="flex space-x-3">
          <EditorInput
            type="url"
            label="URL"
            value={url || ""}
            onChange={(v) => setUrl(embedIndex, v || undefined)}
            className="w-full"
            validationPath={`embeds.${embedIndex}.url`}
          />
          <div>
            <div className="uppercase text-gray-300 text-sm font-medium mb-1.5">
              Color
            </div>
            <ColorPicker
              value={color}
              onChange={(v) => setColor(embedIndex, v)}
            />
            <ValidationError path={`embeds.${embedIndex}.color`} />
          </div>
        </div>
      </div>
    </Collapsable>
  );
}

import { shallow } from "zustand/shallow";
import { embedDescriptionSchema, embedtitleSchema } from "../discord/schema";
import { useCurrentMessageStore } from "../state/message";
import Collapsable from "./Collapsable";
import EditorInput from "./EditorInput";
import ValidationError from "./ValidationError";

interface Props {
  embedIndex: number;
}

export default function EditorEmbedBody({ embedIndex }: Props) {
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

  return (
    <Collapsable id={`embeds.${embedIndex}.content`} title="Body">
      <div className="space-y-3">
        <EditorInput
          label="Title"
          value={title || ""}
          onChange={(v) => setTitle(embedIndex, v || undefined)}
          maxLength={80}
          className="mb-3"
        >
          <ValidationError schema={embedtitleSchema} value={title} />
        </EditorInput>
        <EditorInput
          type="textarea"
          label="Description"
          value={description || ""}
          onChange={(v) => setDescription(embedIndex, v || undefined)}
          maxLength={80}
          className="mb-3"
        >
          <ValidationError
            schema={embedDescriptionSchema}
            value={description}
          />
        </EditorInput>
      </div>
    </Collapsable>
  );
}

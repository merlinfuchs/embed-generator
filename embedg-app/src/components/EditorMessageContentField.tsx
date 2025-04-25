import { useCurrentMessageStore } from "../state/message";
import EditorInput from "./EditorInput";

export default function EditorMessageContentField() {
  const content = useCurrentMessageStore((state) => state.content);
  const setContent = useCurrentMessageStore((state) => state.setContent);

  return (
    <div>
      <EditorInput
        type="textarea"
        label="Content"
        value={content}
        onChange={(v) => setContent(v)}
        maxLength={2000}
        validationPath={`content`}
        controls={true}
      />
    </div>
  );
}

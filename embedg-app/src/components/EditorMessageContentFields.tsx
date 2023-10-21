import { useCurrentMessageStore } from "../state/message";
import EditorInput from "./EditorInput";

export default function EditorMessageContentFields() {
  const username = useCurrentMessageStore((state) => state.username);
  const setUsername = useCurrentMessageStore((state) => state.setUsername);

  const avatarUrl = useCurrentMessageStore((state) => state.avatar_url);
  const setAvatarUrl = useCurrentMessageStore((state) => state.setAvatarUrl);

  const content = useCurrentMessageStore((state) => state.content);
  const setContent = useCurrentMessageStore((state) => state.setContent);

  return (
    <div>
      <div className="flex space-x-3 mb-5">
        <div className="w-1/2">
          <EditorInput
            label="Username"
            value={username || ""}
            onChange={(v) => setUsername(v || undefined)}
            maxLength={80}
            validationPath={`username`}
          />
        </div>
        <div className="w-1/2">
          <EditorInput
            type="url"
            label="Avatar URL"
            value={avatarUrl || ""}
            onChange={(v) => setAvatarUrl(v || undefined)}
            validationPath={`avatar_url`}
          />
        </div>
      </div>
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
    </div>
  );
}

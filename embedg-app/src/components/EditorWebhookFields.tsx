import { useCurrentMessageStore } from "../state/message";
import EditorInput from "./EditorInput";

export default function EditorWebhookFields() {
  const username = useCurrentMessageStore((state) => state.username);
  const setUsername = useCurrentMessageStore((state) => state.setUsername);

  const avatarUrl = useCurrentMessageStore((state) => state.avatar_url);
  const setAvatarUrl = useCurrentMessageStore((state) => state.setAvatarUrl);

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
        <div className="w-1/2 flex space-x-2 items-end">
          <EditorInput
            type="url"
            label="Avatar URL"
            value={avatarUrl || ""}
            onChange={(v) => setAvatarUrl(v || undefined)}
            validationPath={`avatar_url`}
            className="flex-auto"
            imageUpload={true}
          />
        </div>
      </div>
    </div>
  );
}

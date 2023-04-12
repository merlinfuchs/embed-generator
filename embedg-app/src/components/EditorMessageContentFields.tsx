import { useCurrentMessageStore } from "../state/message";
import {
  messageContentSchema,
  webhookUsernameSchema,
  webhookAvatarUrlSchema,
} from "../discord/schema";
import EditorInput from "./EditorInput";
import ValidationError from "./ValidationError";

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
          >
            <ValidationError schema={webhookUsernameSchema} value={username} />
          </EditorInput>
        </div>
        <div className="w-1/2">
          <EditorInput
            type="url"
            label="Avatar URL"
            value={avatarUrl || ""}
            onChange={(v) => setAvatarUrl(v || undefined)}
          >
            <ValidationError
              schema={webhookAvatarUrlSchema}
              value={avatarUrl}
            />
          </EditorInput>
        </div>
      </div>
      <div>
        <EditorInput
          type="textarea"
          label="Content"
          value={content}
          onChange={(v) => setContent(v)}
          maxLength={2000}
        >
          <ValidationError schema={messageContentSchema} value={content} />
        </EditorInput>
      </div>
    </div>
  );
}

import { useCurrentMessageStore } from "@/lib/state/message";
import MessageInput from "./MessageInput";
import { useShallow } from "zustand/react/shallow";

export default function MessageBody() {
  const [username, setUsername, avatarUrl, setAvatarUrl, content, setContent] =
    useCurrentMessageStore(
      useShallow((state) => [
        state.username,
        state.setUsername,
        state.avatar_url,
        state.setAvatarUrl,
        state.content,
        state.setContent,
      ])
    );

  return (
    <div className="space-y-5">
      <div className="flex space-x-3">
        <MessageInput
          label="Username"
          type="text"
          value={username || ""}
          onChange={(v) => setUsername(v || undefined)}
          maxLength={80}
          validationPath="username"
        />
        <MessageInput
          label="Avatar URL"
          type="url"
          value={avatarUrl || ""}
          onChange={(v) => setAvatarUrl(v || undefined)}
          validationPath="avatar_url"
        />
      </div>
      <MessageInput
        label="Content"
        type="textarea"
        value={content}
        onChange={setContent}
        maxLength={2000}
        validationPath="content"
      />
    </div>
  );
}

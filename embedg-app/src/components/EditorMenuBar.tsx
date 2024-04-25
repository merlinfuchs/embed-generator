import {
  TrashIcon,
  CodeBracketSquareIcon,
  SparklesIcon,
  LinkIcon,
} from "@heroicons/react/20/solid";
import { usePremiumGuildFeatures } from "../util/premium";
import EditorUndoButtons from "./EditorUndoButtons";
import EditorIconButton from "./EditorIconButton";

export default function EditorMenuBar() {
  const aiAssistantAllowed = usePremiumGuildFeatures()?.ai_assistant;

  return (
    <div className="flex justify-between items-center mb-5 mt-5">
      <div className="space-x-3.5 flex items-center">
        <EditorUndoButtons />
      </div>
      <div className="space-x-3.5 flex items-center">
        {aiAssistantAllowed && (
          <EditorIconButton
            label="AI Assistant"
            href="/editor/assistant"
            highlight={true}
          >
            <SparklesIcon />
          </EditorIconButton>
        )}
        <EditorIconButton label="Share Message" href="/editor/share">
          <LinkIcon />
        </EditorIconButton>
        <EditorIconButton label="JSON Code" href="/editor/json">
          <CodeBracketSquareIcon />
        </EditorIconButton>
        <EditorIconButton label="Clear Message" href="/editor/clear">
          <TrashIcon />
        </EditorIconButton>
      </div>
    </div>
  );
}

import {
  TrashIcon,
  CodeBracketSquareIcon,
  SparklesIcon,
  LinkIcon,
} from "@heroicons/react/20/solid";
import { usePremiumGuildFeatures } from "../util/premium";
import EditorUndoButtons from "./EditorUndoButtons";
import EditorIconButton from "./EditorIconButton";
import EditorComponentsV2Toggle from "./EditorComponentsV2Toggle";

export default function EditorMenuBar() {
  const aiAssistantAllowed = usePremiumGuildFeatures()?.ai_assistant;
  const componentsV2Allowed = usePremiumGuildFeatures()?.components_v2;

  return (
    <>
      <div className="flex flex-col-reverse md:flex-row gap-5 justify-between md:items-center mb-5 mt-5">
        <div className="space-x-3.5 flex items-center">
          <EditorUndoButtons />
          <EditorIconButton label="Clear Message" href="/editor/clear">
            <TrashIcon />
          </EditorIconButton>
          <EditorIconButton label="JSON Code" href="/editor/json">
            <CodeBracketSquareIcon />
          </EditorIconButton>
          <EditorIconButton label="Share Message" href="/editor/share">
            <LinkIcon />
          </EditorIconButton>
          {aiAssistantAllowed && (
            <EditorIconButton
              label="AI Assistant"
              href="/editor/assistant"
              highlight={true}
            >
              <SparklesIcon />
            </EditorIconButton>
          )}
        </div>

        <div className="space-x-3.5 flex items-center">
          {componentsV2Allowed && <EditorComponentsV2Toggle />}
        </div>
      </div>
    </>
  );
}

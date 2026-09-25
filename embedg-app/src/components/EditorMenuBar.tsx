import {
  TrashIcon,
  CodeBracketSquareIcon,
  SparklesIcon,
  LinkIcon,
  Cog6ToothIcon,
} from "@heroicons/react/20/solid";
import { isDefaultAllowedMentions } from "../discord/allowedMentions";
import { useAllowedMentions } from "../state/document";
import { usePremiumGuildFeatures } from "../util/premium";
import EditorUndoButtons from "./EditorUndoButtons";
import EditorIconButton from "./EditorIconButton";
import EditorComponentsV2Toggle from "./EditorComponentsV2Toggle";

export default function EditorMenuBar() {
  const aiAssistantAllowed = usePremiumGuildFeatures()?.ai_assistant;
  const componentsV2Allowed = usePremiumGuildFeatures()?.components_v2;
  // Easy to forget behind a modal otherwise.
  const settingsChanged = !isDefaultAllowedMentions(useAllowedMentions());

  return (
    <div className="flex flex-wrap-reverse gap-x-5 gap-y-3 justify-between items-center mb-5 mt-5">
      <div className="flex flex-wrap gap-2.5 items-center">
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
        <EditorIconButton
          label={
            settingsChanged ? "Message Settings (changed)" : "Message Settings"
          }
          href="/editor/settings"
          indicator={settingsChanged}
        >
          <Cog6ToothIcon />
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

      <div className="flex items-center">
        {componentsV2Allowed && <EditorComponentsV2Toggle />}
      </div>
    </div>
  );
}

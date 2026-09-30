import {
  CodeBracketSquareIcon,
  SparklesIcon,
  LinkIcon,
  Cog6ToothIcon,
} from "@heroicons/react/20/solid";
// Lucide fills in what heroicons doesn't have.
import { BroomIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { isDefaultAllowedMentions } from "../discord/allowedMentions";
import {
  defaultMessage,
  emptyComponentsV2Message,
} from "../discord/defaultMessage";
import { setCurrentMessage } from "../state/currentMessage";
import { useAllowedMentions, useComponentsV2Enabled } from "../state/document";
import { useSendsToFluxer } from "../state/sendSettings";
import { usePremiumGuildFeatures } from "../util/premium";
import EditorUndoButtons from "./EditorUndoButtons";
import EditorIconButton from "./EditorIconButton";
import EditorComponentsV2Toggle from "./EditorComponentsV2Toggle";

export default function EditorMenuBar() {
  const navigate = useNavigate();
  const componentsV2Enabled = useComponentsV2Enabled();
  const aiAssistantAllowed =
    !!usePremiumGuildFeatures()?.max_ai_prompts_per_month;
  // Easy to forget behind a modal otherwise.
  const settingsChanged = !isDefaultAllowedMentions(useAllowedMentions());
  // Fluxer has no Components V2, the toggle only stays to turn it off.
  const fluxer = useSendsToFluxer();

  return (
    <div className="flex flex-wrap-reverse gap-x-5 gap-y-3 justify-between items-center mb-5 mt-5">
      <div className="flex flex-wrap gap-2.5 items-center">
        <EditorUndoButtons />
        <EditorIconButton
          label="Clear Message (shift-click to skip the templates)"
          onClick={(e) => {
            if (e.shiftKey) {
              setCurrentMessage(
                componentsV2Enabled ? emptyComponentsV2Message : defaultMessage,
              );
            } else {
              navigate("/editor/new");
            }
          }}
        >
          <BroomIcon className="h-full w-full" />
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

      {(!fluxer || componentsV2Enabled) && (
        <div className="flex items-center">
          <EditorComponentsV2Toggle />
        </div>
      )}
    </div>
  );
}

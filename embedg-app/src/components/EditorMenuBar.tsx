import {
  CodeBracketSquareIcon,
  SparklesIcon,
  LinkIcon,
  Cog6ToothIcon,
} from "@heroicons/react/20/solid";
// Lucide fills in what heroicons doesn't have.
import { BroomIcon } from "lucide-react";
import { isDefaultAllowedMentions } from "../discord/allowedMentions";
import {
  defaultMessage,
  emptyComponentsV2Message,
} from "../discord/defaultMessage";
import { setCurrentMessage } from "../state/currentMessage";
import { openEditorDialog, useEditorPanelsStore } from "../state/editorPanels";
import {
  useAllowedMentions,
  useComponentsV2Enabled,
  useSilent,
} from "../state/document";
import { useSendsToFluxer } from "../state/sendSettings";
import { usePremiumGuildFeatures } from "../util/premium";
import EditorUndoButtons from "./EditorUndoButtons";
import EditorIconButton from "./EditorIconButton";
import EditorComponentsV2Toggle from "./EditorComponentsV2Toggle";

export default function EditorMenuBar() {
  const assistantOpen = useEditorPanelsStore((s) => s.assistantOpen);
  const setAssistantOpen = useEditorPanelsStore((s) => s.setAssistantOpen);
  const componentsV2Enabled = useComponentsV2Enabled();
  const aiAssistantAllowed =
    !!usePremiumGuildFeatures()?.max_ai_prompts_per_month;
  // Easy to forget behind a modal otherwise.
  const allowedMentions = useAllowedMentions();
  const silent = useSilent();
  const settingsChanged = !isDefaultAllowedMentions(allowedMentions) || silent;
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
              openEditorDialog("new");
            }
          }}
        >
          <BroomIcon className="h-full w-full" />
        </EditorIconButton>
        <EditorIconButton
          label="JSON Code"
          onClick={() => openEditorDialog("json")}
        >
          <CodeBracketSquareIcon />
        </EditorIconButton>
        <EditorIconButton
          label="Share Message"
          onClick={() => openEditorDialog("share")}
        >
          <LinkIcon />
        </EditorIconButton>
        <EditorIconButton
          label={
            settingsChanged ? "Message Settings (changed)" : "Message Settings"
          }
          onClick={() => openEditorDialog("settings")}
          indicator={settingsChanged}
        >
          <Cog6ToothIcon />
        </EditorIconButton>
        {aiAssistantAllowed && (
          <EditorIconButton
            label="AI Assistant"
            onClick={() => setAssistantOpen(!assistantOpen)}
            highlight={true}
            active={assistantOpen}
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

import {
  DocumentIcon,
  LockClosedIcon,
  SparklesIcon,
} from "@heroicons/react/20/solid";
import { type ReactNode, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserQuery } from "../../api/queries";
import ConfirmModal from "../../components/ConfirmModal";
import LoginLink from "../../components/LoginLink";
import MessagePreview from "../../components/MessagePreview";
import Modal from "../../components/Modal";
import type { Message } from "../../discord/schema";
import {
  type MessageTemplate,
  messageTemplates,
  needsBot,
  templateAvailable,
} from "../../discord/templates";
import {
  clearCurrentMessage,
  currentMessageIsBlank,
  setCurrentMessage,
} from "../../state/currentMessage";
import { useSendSettingsStore } from "../../state/sendSettings";
import { colorIntToHex } from "../../util/discord";
import { usePremiumGuildFeatures } from "../../util/premium";

type LockedReason = "login" | "server";

/** Replaces the message with a template, a blank one or whatever the AI builds. */
export default function NewMessageView() {
  const navigate = useNavigate();

  const { data: user, isPending: userPending } = useUserQuery();
  const guildId = useSendSettingsStore((s) => s.guildId);
  const features = usePremiumGuildFeatures();
  const aiAllowed = !!features?.max_ai_prompts_per_month;
  // Why the templates that need the bot can't be used yet. Nothing while
  // that is still loading.
  const lockedReason: LockedReason | null = userPending
    ? null
    : !user?.success
      ? "login"
      : !guildId
        ? "server"
        : null;

  // Built once per opening, so every use gets its own ids.
  const templates = useMemo(
    () => messageTemplates.map((t) => ({ ...t, message: t.build() })),
    [],
  );
  // What logging in or picking a server unlocks is shown locked, what the plan
  // doesn't include is left out.
  const shown = templates.flatMap<{
    template: (typeof templates)[number];
    locked: LockedReason | null;
  }>((template) =>
    templateAvailable(template.message, features)
      ? [{ template, locked: null }]
      : !features && lockedReason
        ? [{ template, locked: lockedReason }]
        : [],
  );

  // Replacing a message with content asks first, as it's gone for good once
  // the page reloads.
  const [pendingReplace, setPendingReplace] = useState<{
    run: () => void;
  } | null>(null);
  function replace(run: () => void) {
    if (currentMessageIsBlank()) run();
    else setPendingReplace({ run });
  }

  function applyTemplate(message: Message) {
    setCurrentMessage(message);
    if (needsBot(message)) {
      useSendSettingsStore.getState().setMode("channel");
    }
    navigate("/editor");
  }

  function startBlank(path: string) {
    clearCurrentMessage();
    navigate(path);
  }

  return (
    <>
      <Modal width="lg" height="full" onClose={() => navigate("/editor")}>
        <div className="flex flex-col h-full">
          <div className="flex-none px-5 pt-4 pb-3 pr-12 border-b border-white/5">
            <div className="text-lg text-white">New message</div>
            <div className="text-sm text-mist-400">
              Start from a template and make it your own. This replaces the
              message in the editor.
            </div>
          </div>

          <div className="flex-auto min-h-0 overflow-y-auto">
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {shown.map(({ template, locked }) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  locked={locked}
                  onUse={() => replace(() => applyTemplate(template.message))}
                />
              ))}
            </div>
          </div>

          <div className="flex-none flex flex-wrap justify-end gap-3 px-5 py-3 border-t border-white/5">
            {aiAllowed && (
              <FooterButton
                icon={<SparklesIcon className="text-amber-300" />}
                onClick={() => replace(() => startBlank("/editor/assistant"))}
              >
                Describe it to the AI
              </FooterButton>
            )}
            <FooterButton
              icon={<DocumentIcon />}
              onClick={() => replace(() => startBlank("/editor"))}
            >
              Start from scratch
            </FooterButton>
          </div>
        </div>
      </Modal>
      {pendingReplace && (
        <ConfirmModal
          title="Replace the message in the editor?"
          subTitle="It will be lost if you haven't saved it."
          onClose={() => setPendingReplace(null)}
          onConfirm={pendingReplace.run}
        />
      )}
    </>
  );
}

// The preview renders at full width and is scaled down to fit the card.
const THUMBNAIL_SCALE = 0.55;

function TemplateCard({
  template,
  locked,
  onUse,
}: {
  template: MessageTemplate & { message: Message };
  locked: LockedReason | null;
  onUse: () => void;
}) {
  return (
    <div className="relative flex flex-col rounded-xl overflow-hidden bg-ink-800 border border-white/10 hover:border-white/25 focus-within:border-azure-400 transition-colors">
      <div
        className="h-1 flex-none"
        style={{ backgroundColor: colorIntToHex(template.color) }}
      />
      <div
        className="relative flex-none h-56 overflow-hidden pointer-events-none"
        // Only a picture of the message, so its links and buttons stay out of
        // the tab order. React 18 has no type for it yet.
        {...{ inert: "" }}
      >
        <div
          className="px-3 pt-2 origin-top-left"
          style={{
            width: `${100 / THUMBNAIL_SCALE}%`,
            transform: `scale(${THUMBNAIL_SCALE})`,
          }}
        >
          <MessagePreview msg={template.message} />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-12 bg-linear-to-t from-ink-800" />
      </div>
      <div className="flex-auto px-4 pt-2 pb-4">
        <div className="text-mist-100 font-medium">{template.name}</div>
        <div className="text-sm text-mist-400">{template.description}</div>
        {template.group !== "Embeds" && (
          <div className="mt-3 inline-block rounded-full border border-white/15 px-2 py-0.5 text-xs text-mist-300">
            {template.group}
          </div>
        )}
      </div>

      {locked ? (
        <div className="absolute inset-0 bg-ink-900/60">
          {locked === "login" ? (
            <LoginLink className="absolute inset-0 flex items-start justify-center pt-24">
              <LockedLabel>Log in to use</LockedLabel>
            </LoginLink>
          ) : (
            <div className="flex items-start justify-center pt-24">
              <LockedLabel>Select a server to use</LockedLabel>
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          aria-label={`Use ${template.name}`}
          className="absolute inset-0 focus:outline-none"
          onClick={onUse}
        />
      )}
    </div>
  );
}

function LockedLabel({ children }: { children: string }) {
  return (
    <div className="flex items-center space-x-2 rounded-full bg-ink-700 border border-white/10 px-3 py-1.5 text-sm text-mist-100">
      <LockClosedIcon className="h-4 w-4 text-azure-400" />
      <div>{children}</div>
    </div>
  );
}

function FooterButton({
  icon,
  children,
  onClick,
}: {
  icon: ReactNode;
  children: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-white/15 text-mist-100 hover:bg-white/5 hover:border-white/30 transition-colors"
      onClick={onClick}
    >
      <div className="h-5 w-5 flex-none text-mist-300">{icon}</div>
      <div>{children}</div>
    </button>
  );
}

import {
  DocumentIcon,
  LockClosedIcon,
  SparklesIcon,
} from "@heroicons/react/20/solid";
import clsx from "clsx";
import { type ReactNode, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserQuery } from "../../api/queries";
import LoginLink from "../../components/LoginLink";
import MessagePreview from "../../components/MessagePreview";
import Modal from "../../components/Modal";
import { defaultMessage } from "../../discord/defaultMessage";
import { COMPONENTS_V2_FLAG, type Message } from "../../discord/schema";
import {
  messageTemplates,
  templateAvailable,
  usesBot,
} from "../../discord/templates";
import { setCurrentMessage } from "../../state/currentMessage";
import { useSendSettingsStore } from "../../state/sendSettings";
import { usePremiumGuildFeatures } from "../../util/premium";

/** Replaces the message with a template, a blank one or whatever the AI builds. */
export default function NewMessageView() {
  const navigate = useNavigate();

  const { data: user } = useUserQuery();
  const loggedIn = !!user?.success;
  const features = usePremiumGuildFeatures();
  const aiAllowed = !!features?.max_ai_prompts_per_month;

  // Built once per opening, so every use gets its own ids.
  const templates = useMemo(
    () => messageTemplates.map((t) => ({ ...t, message: t.build() })),
    [],
  );
  const available = templates.filter((t) =>
    templateAvailable(t.message, features),
  );
  const locked = available.length < templates.length;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  // On small screens the preview is below the list, out of sight.
  const previewRef = useRef<HTMLDivElement>(null);
  function select(id: string) {
    setSelectedId(id);
    previewRef.current?.scrollIntoView?.({
      behavior: "smooth",
      block: "nearest",
    });
  }
  const selected =
    available.find((t) => t.id === selectedId) ?? available[0] ?? null;

  function start(message: Message, path = "/editor") {
    setCurrentMessage(message);
    // Webhooks drop the components, so only the bot can send them.
    if (message.components.length > 0) {
      useSendSettingsStore.getState().setMode("channel");
    }
    navigate(path);
  }

  const groups = [
    {
      label: "Embeds",
      templates: available.filter(
        (t) => !isComponentsV2(t.message) && !usesBot(t.message),
      ),
    },
    {
      label: "Components V2",
      templates: available.filter(
        (t) => isComponentsV2(t.message) && !usesBot(t.message),
      ),
    },
    {
      label: "Interactive",
      templates: available.filter((t) => usesBot(t.message)),
    },
  ];

  return (
    <Modal width="lg" height="full" onClose={() => navigate("/editor")}>
      <div className="flex flex-col h-full">
        <div className="flex-none px-5 pt-4 pb-3 pr-12 border-b border-white/5">
          <div className="text-lg text-white">New message</div>
          <div className="text-sm text-mist-400">
            Start from a template and make it your own. This replaces the
            message in the editor, which you can undo.
          </div>
        </div>

        <div className="flex flex-col md:flex-row flex-auto min-h-0 overflow-y-auto md:overflow-y-hidden">
          <div className="md:w-72 flex-none md:overflow-y-auto p-3 space-y-1 md:border-r border-white/5">
            <OptionButton
              icon={<DocumentIcon />}
              label="Blank message"
              description="Start from scratch"
              onClick={() => start(defaultMessage)}
            />
            {aiAllowed && (
              <OptionButton
                icon={<SparklesIcon className="text-amber-300" />}
                label="Describe it to the AI"
                description="The assistant builds it for you"
                onClick={() => start(defaultMessage, "/editor/assistant")}
              />
            )}

            {groups.map(
              (group) =>
                group.templates.length > 0 && (
                  <div key={group.label} className="pt-3">
                    <div className="px-3 pb-1 uppercase text-xs font-medium text-mist-400">
                      {group.label}
                    </div>
                    {group.templates.map((t) => (
                      <OptionButton
                        key={t.id}
                        label={t.name}
                        description={t.description}
                        selected={t.id === selected?.id}
                        onClick={() => select(t.id)}
                      />
                    ))}
                  </div>
                ),
            )}

            {locked && !features && (
              <div className="mt-3 p-3 rounded-lg bg-ink-800 border border-white/5 text-sm text-mist-300 space-y-2">
                <div className="flex items-center space-x-2 text-mist-100">
                  <LockClosedIcon className="h-4 w-4 flex-none text-azure-400" />
                  <div>More templates</div>
                </div>
                {loggedIn ? (
                  <div>
                    Select a server at the top of the editor to see the
                    Components V2 and interactive templates.
                  </div>
                ) : (
                  <>
                    <div>
                      Log in to see the Components V2 and interactive templates,
                      and to build messages with the AI.
                    </div>
                    <LoginLink className="inline-block bg-azure-500 hover:bg-azure-400 transition-colors px-3 py-1.5 rounded-lg text-white font-medium">
                      Log in
                    </LoginLink>
                  </>
                )}
              </div>
            )}
          </div>

          {selected && (
            <div
              ref={previewRef}
              className="flex-auto flex flex-col min-w-0 min-h-0"
            >
              <div className="flex-auto md:overflow-y-auto bg-ink-800 px-5 py-3">
                <MessagePreview
                  msg={selected.message}
                  sendMode={usesBot(selected.message) ? "channel" : undefined}
                />
              </div>
              <div className="flex-none flex items-center justify-end gap-3 px-5 py-3 border-t border-white/5">
                {usesBot(selected.message) && (
                  <div className="text-sm text-mist-400">
                    Needs the bot on your server. Pick the roles for each button
                    before sending.
                  </div>
                )}
                <button
                  type="button"
                  className="flex-none bg-azure-500 hover:bg-azure-400 transition-colors px-4 py-2 rounded-lg text-white font-medium"
                  onClick={() => start(selected.message)}
                >
                  Use template
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

function isComponentsV2(message: Message) {
  return ((message.flags ?? 0) & COMPONENTS_V2_FLAG) !== 0;
}

function OptionButton({
  icon,
  label,
  description,
  selected,
  onClick,
}: {
  icon?: ReactNode;
  label: string;
  description: string;
  selected?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={clsx(
        "w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors",
        selected ? "bg-white/10" : "hover:bg-white/5",
      )}
      onClick={onClick}
    >
      {icon && <div className="h-5 w-5 flex-none text-mist-300">{icon}</div>}
      <div className="min-w-0">
        <div className="text-sm text-mist-100">{label}</div>
        <div className="text-xs text-mist-400">{description}</div>
      </div>
    </button>
  );
}

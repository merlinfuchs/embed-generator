import {
  ArrowLeftIcon,
  DocumentIcon,
  LockClosedIcon,
  SparklesIcon,
} from "@heroicons/react/20/solid";
import clsx from "clsx";
import { type ReactNode, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserQuery } from "../../api/queries";
import { ChannelSelect } from "../../components/ChannelSelect";
import ConfirmModal from "../../components/ConfirmModal";
import LoginLink from "../../components/LoginLink";
import MessagePreview from "../../components/MessagePreview";
import Modal from "../../components/Modal";
import { RoleSelect } from "../../components/RoleSelect";
import {
  defaultMessage,
  emptyComponentsV2Message,
} from "../../discord/defaultMessage";
import type { Message } from "../../discord/schema";
import {
  EMPTY_TEMPLATE_INPUT,
  type MessageTemplate,
  type TemplateFormat,
  messageTemplates,
  needsBot,
  templateAvailable,
} from "../../discord/templates";
import {
  currentMessageIsBlank,
  setCurrentMessage,
} from "../../state/currentMessage";
import { useSendSettingsStore } from "../../state/sendSettings";
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

  const [format, setFormat] = useState<TemplateFormat>("componentsV2");

  // Built once per opening and format, so every use gets its own ids.
  const templates = useMemo(
    () =>
      messageTemplates.map((t) => ({
        ...t,
        message: t.build[format](EMPTY_TEMPLATE_INPUT),
      })),
    [format],
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

  // Templates that ask for roles or channels get a step to pick them, which
  // takes a server to pick from.
  const [filling, setFilling] = useState<MessageTemplate | null>(null);
  function pickTemplate(template: MessageTemplate, message: Message) {
    if (features && guildId && template.fields?.length) {
      setFilling(template);
    } else {
      replace(() => applyTemplate(message));
    }
  }

  function startBlank(path: string) {
    setCurrentMessage(
      format === "componentsV2" ? emptyComponentsV2Message : defaultMessage,
    );
    navigate(path);
  }

  return (
    <>
      <Modal width="lg" height="full" onClose={() => navigate("/editor")}>
        <div className="flex flex-col h-full">
          {filling && guildId ? (
            <TemplateFields
              template={filling}
              format={format}
              guildId={guildId}
              onBack={() => setFilling(null)}
              onUse={(message) => replace(() => applyTemplate(message))}
            />
          ) : (
            <>
              <div className="flex-none flex flex-wrap items-center justify-between gap-3 px-5 pt-4 pb-3 pr-12 border-b border-white/5">
                <div>
                  <div className="text-lg text-white">New message</div>
                  <div className="text-sm text-mist-400">
                    Start from a template and make it your own. This replaces
                    the message in the editor.
                  </div>
                </div>
                <FormatToggle format={format} onChange={setFormat} />
              </div>

              <div className="flex-auto min-h-0 overflow-y-auto">
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {shown.map(({ template, locked }) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      locked={locked}
                      onUse={() => pickTemplate(template, template.message)}
                    />
                  ))}
                </div>
              </div>

              <div className="flex-none flex flex-wrap justify-end gap-3 px-5 py-3 border-t border-white/5">
                {aiAllowed && (
                  <FooterButton
                    icon={<SparklesIcon className="text-amber-300" />}
                    onClick={() =>
                      replace(() => startBlank("/editor/assistant"))
                    }
                  >
                    Describe it to the AI
                  </FooterButton>
                )}
                <FooterButton
                  icon={<DocumentIcon />}
                  primary
                  onClick={() => replace(() => startBlank("/editor"))}
                >
                  Start from scratch
                </FooterButton>
              </div>
            </>
          )}
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

/** Picks the roles and channels a template asks for, next to a live preview. */
function TemplateFields({
  template,
  format,
  guildId,
  onBack,
  onUse,
}: {
  template: MessageTemplate;
  format: TemplateFormat;
  guildId: string;
  onBack: () => void;
  onUse: (message: Message) => void;
}) {
  const [values, setValues] = useState<Partial<Record<string, string>>>({});
  const message = useMemo(
    () => template.build[format]({ values, guildId }),
    [template, format, values, guildId],
  );

  function setValue(id: string, value: string | null) {
    setValues((v) => ({ ...v, [id]: value ?? undefined }));
  }

  return (
    <>
      <div className="flex-none px-5 pt-4 pb-3 pr-12 border-b border-white/5">
        <div className="text-lg text-white">Set up {template.name}</div>
        <div className="text-sm text-mist-400">
          Pick what the template should use. Anything you leave empty can be
          filled in in the editor.
        </div>
      </div>

      <div className="flex-auto min-h-0 overflow-y-auto">
        <div className="p-5 flex flex-col md:flex-row gap-6">
          <div className="md:w-80 flex-none space-y-4">
            {template.fields?.map((field) => (
              <div key={field.id}>
                <div className="uppercase text-mist-300 text-sm font-medium mb-1.5">
                  {field.label}
                </div>
                {field.type === "role" ? (
                  <RoleSelect
                    guildId={guildId}
                    roleId={values[field.id] ?? null}
                    onChange={(id) => setValue(field.id, id)}
                  />
                ) : (
                  <ChannelSelect
                    guildId={guildId}
                    channelId={values[field.id] ?? null}
                    onChange={(id) => setValue(field.id, id)}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex-auto min-w-0 rounded-xl bg-ink-800 border border-white/10 px-4 py-3">
            <MessagePreview msg={message} />
          </div>
        </div>
      </div>

      <div className="flex-none flex flex-wrap justify-between gap-3 px-5 py-3 border-t border-white/5">
        <FooterButton icon={<ArrowLeftIcon />} onClick={onBack}>
          Back
        </FooterButton>
        <FooterButton
          icon={<DocumentIcon />}
          primary
          onClick={() => onUse(message)}
        >
          Use template
        </FooterButton>
      </div>
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
        {needsBot(template.message) && (
          <div className="mt-3 inline-block rounded-full border border-white/15 px-2 py-0.5 text-xs text-mist-300">
            Interactive
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

const FORMATS: [TemplateFormat, string][] = [
  ["embeds", "Embeds V1"],
  ["componentsV2", "Components V2"],
];

/** Which kind of message the templates and a blank start are, like the editor's toggle. */
function FormatToggle({
  format,
  onChange,
}: {
  format: TemplateFormat;
  onChange: (format: TemplateFormat) => void;
}) {
  return (
    <div className="flex bg-ink-900 p-1 rounded-lg border border-white/10 text-sm font-medium text-mist-400 whitespace-nowrap">
      {FORMATS.map(([value, label]) => (
        <button
          key={value}
          type="button"
          aria-pressed={format === value}
          className={clsx(
            "py-1 px-3 rounded-md transition-colors",
            format === value
              ? "bg-ink-700 text-mist-100"
              : "hover:text-mist-100",
          )}
          onClick={() => onChange(value)}
        >
          {label}
        </button>
      ))}
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
  primary,
  children,
  onClick,
}: {
  icon: ReactNode;
  primary?: boolean;
  children: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={clsx(
        "flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors",
        primary
          ? "bg-azure-500 hover:bg-azure-400 text-white font-medium"
          : "border border-white/15 text-mist-100 hover:bg-white/5 hover:border-white/30",
      )}
      onClick={onClick}
    >
      <div
        className={clsx(
          "h-5 w-5 flex-none",
          primary ? "text-white" : "text-mist-300",
        )}
      >
        {icon}
      </div>
      <div>{children}</div>
    </button>
  );
}

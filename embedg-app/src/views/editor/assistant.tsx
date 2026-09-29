import {
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  ClockIcon,
  InformationCircleIcon,
  PaperAirplaneIcon,
  PencilSquareIcon,
  SparklesIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";
import clsx from "clsx";
import {
  memo,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import TextareaAutosize from "react-textarea-autosize";
import { Link, useNavigate } from "react-router-dom";
import { useAssistantChatMutation } from "../../api/mutations";
import { useAssistantUsageQuery } from "../../api/queries";
import type { AssistantChatMessageWire } from "../../api/wire";
import AssistantFieldsCard from "../../components/AssistantFieldsCard";
import AssistantMarkdown from "../../components/AssistantMarkdown";
import {
  type AssistantChatEntry,
  useAssistantStore,
} from "../../state/assistant";
import {
  getCurrentMessage,
  setCurrentMessage,
} from "../../state/currentMessage";
import {
  useDocumentStoreApi,
  useDocumentUndoStore,
} from "../../state/document";
import { useSendSettingsStore } from "../../state/sendSettings";
import { runAssistantPrompt } from "../../util/assistant";
import { usePremiumGuildFeatures } from "../../util/premium";

/** A chat next to the editor that builds and changes the message. */
export default function AssistantView() {
  const navigate = useNavigate();

  const guildId = useSendSettingsStore((s) => s.guildId);
  const features = usePremiumGuildFeatures();
  const { data: usage } = useAssistantUsageQuery(guildId);
  const chat = useAssistantChatMutation();

  const entries = useAssistantStore((s) => s.entries);
  const busy = useAssistantStore((s) => s.busy);
  const clear = useAssistantStore((s) => s.clear);
  const setGuildId = useAssistantStore((s) => s.setGuildId);

  useEffect(() => setGuildId(guildId), [guildId, setGuildId]);

  const [input, setInput] = useState("");

  // "Build this" puts the suggested request into the input, so the user can
  // fill in what only they know before it uses a prompt.
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fillInput = useCallback((prompt: string) => {
    setInput(prompt);
    inputRef.current?.focus();
  }, []);

  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries, busy]);

  const send = useCallback(
    async (content: string) => {
      if (!guildId) return;

      // The store rather than the rendered state, as the prompt keeps going
      // when the panel is closed.
      const { entries, addEntry, setBusy } = useAssistantStore.getState();
      const messages: AssistantChatMessageWire[] = [
        // Failed requests are left out with their error, so the assistant
        // doesn't make them again.
        ...entries
          .filter((e, i) => !e.failed && !entries[i + 1]?.failed)
          .map(({ role, content }) => ({ role, content })),
        { role: "user", content },
      ];
      addEntry(guildId, { role: "user", content });
      setBusy(true);

      try {
        const res = await runAssistantPrompt({
          messages,
          getMessage: getCurrentMessage,
          applyMessage: (message) => {
            // The message was for the server the chat was about.
            if (useAssistantStore.getState().guildId === guildId) {
              setCurrentMessage(message);
            }
          },
          send: (req) => chat.mutateAsync({ guildId, req }),
        });
        addEntry(guildId, {
          role: "assistant",
          content: res.message,
          buildPrompt: res.buildPrompt,
          fields: res.fields,
          issues: res.issues,
          repaired: res.repairs > 0 && res.issues.length === 0,
        });
      } catch (err) {
        addEntry(guildId, {
          role: "assistant",
          content: (err as Error).message,
          failed: true,
        });
      } finally {
        setBusy(false);
      }
    },
    [guildId, chat.mutateAsync],
  );

  const submit = useCallback(() => {
    const content = input.trim();
    if (!content || busy) return;
    setInput("");

    send(content);
  }, [input, busy, send]);

  const limit = usage?.success ? usage.data.prompts_limit : undefined;
  const left = usage?.success
    ? Math.max(usage.data.prompts_limit - usage.data.prompts_used, 0)
    : undefined;
  // Why no prompt can be sent, like the limit being reached.
  const unavailableReason = !guildId
    ? "Select a server at the top to use the AI assistant."
    : usage?.success
      ? usage.data.unavailable
      : "";
  const unavailable = !!unavailableReason;

  const lastEntry = entries.at(-1);

  return (
    <div className="fixed inset-0 z-30 lg:static lg:z-auto lg:w-96 flex-none flex flex-col bg-ink-800 lg:border-l border-white/5">
      <div className="flex-none flex items-center justify-between px-5 h-14 border-b border-white/5">
        <div className="flex items-center space-x-2 text-mist-100 font-medium">
          <SparklesIcon className="h-5 w-5 text-amber-300" />
          <div>AI Assistant</div>
        </div>
        <div className="flex items-center space-x-1">
          <UndoButtons />
          <HeaderButton
            label="New chat"
            disabled={busy || entries.length === 0}
            onClick={clear}
          >
            <PencilSquareIcon className="h-5 w-5" />
          </HeaderButton>
          <HeaderButton label="Close" onClick={() => navigate("/editor")}>
            <XMarkIcon className="h-5 w-5" />
          </HeaderButton>
        </div>
      </div>

      <div className="flex-auto overflow-y-auto px-5 py-3 space-y-4 text-sm text-mist-300">
        {entries.length === 0 && (
          <div className="space-y-2 text-mist-400">
            <p>
              Describe the message you want, like &quot;A welcome message for my
              gaming server with a button that gives the Member role&quot;, or
              ask for a change to the one in the editor.
            </p>
            <p>
              Changes are applied right away. You can undo them, and nothing is
              sent until you send it.
            </p>
            <p>
              Each request that changes the message uses one prompt. Answers
              without changes, like questions the AI asks back, and fixes of its
              own mistakes are free.
            </p>
          </div>
        )}
        {entries.map((entry, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: the chat is append-only
          <ChatBubble key={i} entry={entry} onBuild={fillInput} />
        ))}
        {!busy && !unavailable && guildId && !!lastEntry?.fields?.length && (
          <AssistantFieldsCard
            key={entries.length}
            guildId={guildId}
            fields={lastEntry.fields}
            onSend={send}
          />
        )}
        {busy && (
          <div className="flex items-center space-x-3 text-mist-400">
            <div className="relative">
              <div className="h-3 w-3 rounded-full bg-azure-500"></div>
              <div className="h-3 w-3 rounded-full bg-azure-500 animate-ping absolute inset-0"></div>
            </div>
            <div>Working on it...</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex-none px-5 pb-5 pt-2 space-y-2">
        {unavailable ? (
          <UnavailableCard
            reason={unavailableReason}
            resetsAt={
              usage?.success && usage.data.limit_reached
                ? usage.data.resets_at
                : null
            }
            showPremium={
              !!usage?.success &&
              usage.data.limit_reached &&
              !features?.is_premium
            }
          />
        ) : (
          <>
            <div className="relative">
              <TextareaAutosize
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submit();
                  }
                }}
                placeholder="Ask for a message or a change..."
                maxLength={4000}
                minRows={2}
                maxRows={8}
                className="bg-ink-900 pl-3 pr-12 py-2 rounded-lg w-full text-white text-sm focus:outline-none resize-none"
              />
              <button
                type="button"
                title="Send"
                aria-label="Send"
                disabled={busy || !input.trim()}
                className="absolute bottom-3 right-2 p-1.5 rounded-lg bg-azure-500 hover:bg-azure-400 text-white disabled:bg-ink-600 disabled:cursor-not-allowed"
                onClick={submit}
              >
                <PaperAirplaneIcon className="h-4 w-4" />
              </button>
            </div>
            {!!limit && (
              <div className="text-xs text-mist-400">
                {left} of {limit} prompts left this month
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Undo and redo, as the editor with its own buttons is hidden next to the
 * chat on smaller screens. The editor's buttons stay mounted and own the
 * keyboard shortcuts, so they aren't handled twice.
 */
function UndoButtons() {
  const { undo, redo } = useDocumentStoreApi().temporal.getState();
  const isTracking = useDocumentUndoStore((s) => s.isTracking);
  const canUndo = useDocumentUndoStore((s) => s.pastStates.length !== 0);
  const canRedo = useDocumentUndoStore((s) => s.futureStates.length !== 0);

  // Off when edit history is turned off in the settings.
  if (!isTracking) return null;

  return (
    <>
      <HeaderButton label="Undo" disabled={!canUndo} onClick={() => undo(1)}>
        <ArrowUturnLeftIcon className="h-5 w-5" />
      </HeaderButton>
      <HeaderButton label="Redo" disabled={!canRedo} onClick={() => redo(1)}>
        <ArrowUturnRightIcon className="h-5 w-5" />
      </HeaderButton>
      <div className="h-5 w-px bg-white/10 mx-1" />
    </>
  );
}

function HeaderButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      className="p-1.5 rounded-lg text-mist-300 hover:text-mist-100 hover:bg-white/5 disabled:text-mist-500 disabled:hover:bg-transparent"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

/** Takes the place of the input when no prompt can be sent. */
function UnavailableCard({
  reason,
  resetsAt,
  showPremium,
}: {
  reason: string;
  // When the monthly limits start over, if they are the reason.
  resetsAt: string | null;
  showPremium: boolean;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-ink-700 p-4 space-y-3 text-sm">
      <div className="flex space-x-3">
        {resetsAt ? (
          <ClockIcon className="h-5 w-5 flex-none text-amber-300" />
        ) : (
          <InformationCircleIcon className="h-5 w-5 flex-none text-mist-400" />
        )}
        <div className="space-y-1">
          <div className="text-mist-100 font-medium">{reason}</div>
          {resetsAt && (
            <div className="text-mist-400">
              You can use the AI assistant again on{" "}
              {/* The app is in English, and the limits start over at midnight UTC. */}
              {new Date(resetsAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                timeZone: "UTC",
              })}
              .
            </div>
          )}
        </div>
      </div>
      {showPremium && (
        <Link
          to="/premium"
          className="bg-amber-400 hover:bg-amber-300 text-ink-900 font-medium px-3 py-2 rounded-lg block w-full text-center transition-colors"
        >
          Get more prompts with Premium
        </Link>
      )}
    </div>
  );
}

// Memoized, as the chat re-renders on every keystroke in the input.
const ChatBubble = memo(function ChatBubble({
  entry,
  onBuild,
}: {
  entry: AssistantChatEntry;
  onBuild: (prompt: string) => void;
}) {
  if (entry.role === "user") {
    return (
      <div className="ml-8 rounded-lg bg-azure-500/15 text-mist-100 px-3 py-2 whitespace-pre-wrap break-words">
        {entry.content}
      </div>
    );
  }

  return (
    <div className={clsx("mr-8 space-y-2", entry.failed && "text-red")}>
      {entry.failed ? (
        <p className="whitespace-pre-wrap">{entry.content}</p>
      ) : (
        entry.content && <AssistantMarkdown text={entry.content} />
      )}
      {entry.buildPrompt && (
        <button
          type="button"
          title={entry.buildPrompt}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-white/10 text-mist-100 hover:bg-white/5"
          onClick={() => onBuild(entry.buildPrompt ?? "")}
        >
          <SparklesIcon className="h-4 w-4 text-amber-300" />
          <div>Build this</div>
        </button>
      )}
      {entry.repaired && (
        <p className="text-xs text-mist-400">
          Fixed problems with its changes.
        </p>
      )}
      {!!entry.issues?.length && (
        <div className="text-xs text-mist-400">
          <p>Some problems are left:</p>
          <ul className="list-disc pl-4">
            {entry.issues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
});

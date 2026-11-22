import { XMarkIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { defaultPoll } from "../discord/defaultMessage";
import {
  POLL_ANSWER_LIMIT,
  POLL_ANSWERS_LIMIT,
  POLL_QUESTION_LIMIT,
  type Poll,
  type PollAnswer,
} from "../discord/schema";
import {
  type MessageNode,
  useDocument,
  useDocumentStoreApi,
  usePoll,
} from "../state/document";
import { useCollapsedStatesStore } from "../state/collapsed";
import CheckBox from "./CheckBox";
import Collapsable from "./Collapsable";
import EditorComponentEmojiSelect from "./EditorComponentEmojiSelect";
import EditorInput from "./EditorInput";
import PollAttachmentsNotice, {
  usePollWithAttachments,
} from "./PollAttachmentsNotice";

/** Durations to pick from, in hours, up to the longest Discord takes. */
const DURATIONS: { hours: number; label: string }[] = [
  { hours: 1, label: "1 hour" },
  { hours: 4, label: "4 hours" },
  { hours: 8, label: "8 hours" },
  { hours: 24, label: "24 hours" },
  { hours: 72, label: "3 days" },
  { hours: 168, label: "1 week" },
  { hours: 336, label: "2 weeks" },
  { hours: 768, label: "32 days" },
];

export default function EditorPoll() {
  const rootId = useDocument((state) => state.rootId);
  const poll = usePoll();
  const { update } = useDocumentStoreApi().getState();

  function setPoll(next: Poll | undefined) {
    // Without a poll the section would fold away along with the button to add one again.
    if (!next) useCollapsedStatesStore.getState().setCollapsed("poll", false);
    update<MessageNode>(rootId, { poll: next });
  }

  return (
    <Collapsable
      id="poll"
      title="Poll"
      size="large"
      // Open when the message already has a poll, like a restored one.
      defaultCollapsed={!poll}
      validationPathPrefix="poll"
      extra={
        poll && (
          <div className="text-sm italic font-light text-mist-400">
            {poll.answers.length} / {POLL_ANSWERS_LIMIT} answers
          </div>
        )
      }
    >
      {poll ? (
        <PollFields poll={poll} setPoll={setPoll} />
      ) : (
        <>
          <div className="text-mist-400 mb-3">
            Let people vote on a question. Discord shows the poll below the
            embeds.
          </div>
          <button
            type="button"
            className="px-3 py-2 rounded-lg text-white bg-azure-500 hover:bg-azure-400 transition-colors"
            onClick={() => setPoll(defaultPoll())}
          >
            Add Poll
          </button>
        </>
      )}
    </Collapsable>
  );
}

function PollFields({
  poll,
  setPoll,
}: {
  poll: Poll;
  setPoll: (poll: Poll | undefined) => void;
}) {
  function setAnswer(index: number, answer: PollAnswer) {
    setPoll({
      ...poll,
      answers: poll.answers.map((a, i) => (i === index ? answer : a)),
    });
  }

  const canAddAnswer = poll.answers.length < POLL_ANSWERS_LIMIT;
  const customDuration = !DURATIONS.some((d) => d.hours === poll.duration);
  const pollWithAttachments = usePollWithAttachments();

  return (
    <div className="space-y-4">
      {pollWithAttachments && <PollAttachmentsNotice />}
      <EditorInput
        label="Question"
        value={poll.question.text}
        onChange={(text) => setPoll({ ...poll, question: { text } })}
        maxLength={POLL_QUESTION_LIMIT}
        validationPath="poll.question.text"
      />

      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-mist-400 mb-1.5">
          Answers
        </div>
        <div className="space-y-3">
          {poll.answers.map((answer, i) => (
            <div
              // Answers have no identity of their own, so removing one reuses the rows after it.
              // biome-ignore lint/suspicious/noArrayIndexKey: see above
              key={i}
              className="flex space-x-3"
            >
              {/* Lined up with the input, below its label. */}
              <div className="mt-6.5">
                <EditorComponentEmojiSelect
                  compact
                  emoji={answer.poll_media.emoji}
                  onChange={(emoji) =>
                    setAnswer(i, {
                      poll_media: { ...answer.poll_media, emoji },
                    })
                  }
                />
              </div>
              <EditorInput
                label={`Answer ${i + 1}`}
                value={answer.poll_media.text}
                onChange={(text) =>
                  setAnswer(i, { poll_media: { ...answer.poll_media, text } })
                }
                maxLength={POLL_ANSWER_LIMIT}
                className="flex-auto"
                validationPath={`poll.answers.${i}.poll_media.text`}
              />
              <button
                type="button"
                aria-label={`Remove answer ${i + 1}`}
                disabled={poll.answers.length <= 1}
                className="flex-none mt-6.5 h-10.5 w-10 flex items-center justify-center rounded-lg text-mist-400 hover:text-white hover:bg-ink-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-mist-400 transition-colors"
                onClick={() =>
                  setPoll({
                    ...poll,
                    answers: poll.answers.filter((_, j) => j !== i),
                  })
                }
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          disabled={!canAddAnswer}
          className={clsx(
            "mt-3 px-3 py-2 rounded-lg transition-colors whitespace-nowrap",
            canAddAnswer
              ? "bg-azure-500 hover:bg-azure-400 text-white"
              : "bg-ink-900 cursor-not-allowed text-mist-300",
          )}
          onClick={() =>
            canAddAnswer &&
            setPoll({
              ...poll,
              answers: [...poll.answers, { poll_media: { text: "" } }],
            })
          }
        >
          Add Answer
        </button>
      </div>

      <div className="flex flex-wrap gap-5 items-end">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-mist-400 mb-1.5">
            Duration
          </div>
          <select
            aria-label="Duration"
            className="bg-ink-900 rounded-lg px-3 py-2 font-light cursor-pointer text-white"
            value={poll.duration.toString()}
            onChange={(e) =>
              setPoll({
                ...poll,
                duration: Number.parseInt(e.target.value, 10),
              })
            }
          >
            {customDuration && (
              <option value={poll.duration.toString()}>
                {poll.duration} hours
              </option>
            )}
            {DURATIONS.map((d) => (
              <option key={d.hours} value={d.hours.toString()}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <CheckBox
            label="Allow multiple answers"
            checked={poll.allow_multiselect}
            onChange={(allow_multiselect) =>
              setPoll({ ...poll, allow_multiselect })
            }
          />
          <div className="text-mist-100">Allow multiple answers</div>
        </div>
      </div>

      <div className="text-mist-400 text-sm font-light">
        Discord doesn't let you change a poll after it's sent. Editing the
        message keeps the poll it was sent with.
      </div>

      <button
        type="button"
        className="px-3 py-2 rounded-lg border-2 border-red/70 hover:bg-red hover:border-red transition-colors text-white whitespace-nowrap"
        onClick={() => setPoll(undefined)}
      >
        Remove Poll
      </button>
    </div>
  );
}

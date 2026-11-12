import clsx from "clsx";
import type { Poll } from "../discord/schema";

/** How long is left, the way Discord counts it: in hours up to two days, then in days. */
export function formatPollDuration(hours: number): string {
  if (hours < 48) {
    return `${hours} ${hours === 1 ? "hour" : "hours"} left`;
  }

  const days = Math.ceil(hours / 24);
  return `${days} days left`;
}

/** A poll as Discord shows it before anyone has voted. */
export default function MessagePreviewPoll({ poll }: { poll: Poll }) {
  return (
    <div className="discord-poll">
      <div className="discord-poll-question">{poll.question.text}</div>
      <div className="discord-poll-hint">
        {poll.allow_multiselect
          ? "Select one or more answers"
          : "Select one answer"}
      </div>
      <div className="discord-poll-answers">
        {poll.answers.map((answer, i) => {
          const emoji = answer.poll_media.emoji;

          return (
            <div
              // Answers have no identity of their own.
              // biome-ignore lint/suspicious/noArrayIndexKey: see above
              key={i}
              className="discord-poll-answer"
            >
              {emoji && (
                <span className="discord-poll-answer-emoji">
                  {emoji.id ? (
                    <img
                      src={`https://cdn.discordapp.com/emojis/${emoji.id}.${
                        emoji.animated ? "gif" : "webp"
                      }`}
                      alt={emoji.name}
                    />
                  ) : (
                    // Turned into an image by the Twemoji around the whole message.
                    emoji.name
                  )}
                </span>
              )}
              <span className="discord-poll-answer-text">
                {answer.poll_media.text}
              </span>
              <span
                className={clsx(
                  "discord-poll-answer-select",
                  poll.allow_multiselect && "discord-poll-answer-select-multi",
                )}
              />
            </div>
          );
        })}
      </div>
      <div className="discord-poll-footer">
        0 votes <span aria-hidden="true">•</span>{" "}
        {formatPollDuration(poll.duration)}
      </div>
    </div>
  );
}

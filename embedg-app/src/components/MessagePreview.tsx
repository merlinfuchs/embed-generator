import "./MessagePreview.css";
import { format } from "date-fns";
import { useState } from "react";
import {
  COMPONENTS_V2_FLAG,
  type Message,
  type MessageComponent,
} from "../discord/schema";
import { useSendSettingsStore } from "../state/sendSettings";
import Twemoji from "./Twemoji";
import { useGuildBrandingQuery } from "../api/queries";
import { getRelativeUrl } from "../util/url";
import PreviewComponents, { Markup } from "./MessagePreviewComponents";
import MessagePreviewEmbed from "./MessagePreviewEmbed";

interface ButtonResponse {
  id: number;
  text: string;
}

interface Props {
  msg: Message;
  /**
   * The container a link in the message unfurls into, rendered below the
   * content the way Discord shows a component embed. Not part of the message
   * itself, so it sits alongside the content rather than replacing it.
   */
  unfurledComponent?: MessageComponent;
}

export default function MessagePreview({ msg, unfurledComponent }: Props) {
  const currentTime = format(new Date(), "hh:mm aa");
  // A Components V2 message carries its content in the components instead.
  const componentsV2 = ((msg.flags ?? 0) & COMPONENTS_V2_FLAG) !== 0;
  const sendMode = useSendSettingsStore((state) => state.mode);
  const [responses, setResponses] = useState<ButtonResponse[]>([]);

  const guildId = useSendSettingsStore((s) => s.guildId);
  const { data: branding } = useGuildBrandingQuery(guildId);

  const defaultUsername =
    (branding?.success && branding.data.default_username) || "Embed Generator";
  const defaultAvatarUrl =
    (branding?.success && branding.data.default_avatar_url) ||
    getRelativeUrl("/logo.svg");

  return (
    <Twemoji>
      <div
        className="discord-messages"
        style={{
          border: "none",
          whiteSpace: "pre-wrap",
          wordWrap: "break-word",
        }}
      >
        <div className="discord-message">
          <div className="discord-message-inner">
            <div className="discord-author-avatar">
              <img src={msg.avatar_url || defaultAvatarUrl} alt="" />
            </div>
            <div className="discord-message-content">
              <span className="discord-author-info">
                <span className="discord-author-username">
                  {msg.username || defaultUsername}
                </span>
                <span className="discord-application-tag">Bot</span>
              </span>
              <span className="discord-message-timestamp pl-1">
                Today at {currentTime}
              </span>
              {componentsV2 ? (
                <div className="discord-message-compact-indent">
                  <PreviewComponents components={msg.components} />
                </div>
              ) : (
                <>
                  {!!msg.content && (
                    <div className="discord-message-body">
                      <Markup content={msg.content} />
                    </div>
                  )}

                  <div className="discord-message-compact-indent">
                    {msg.embeds.map((embed) => (
                      <MessagePreviewEmbed key={embed.id} embed={embed} />
                    ))}

                    <div className="discord-attachments">
                      {sendMode === "channel" && (
                        <PreviewComponents
                          components={msg.components.filter(
                            (component) => component.type === 1,
                          )}
                        />
                      )}
                    </div>
                  </div>
                </>
              )}
              {unfurledComponent && (
                <div className="discord-message-compact-indent">
                  <PreviewComponents components={[unfurledComponent]} />
                </div>
              )}
            </div>
          </div>
        </div>
        {responses.map((resp) => (
          <div
            className="discord-message discord-highlight-ephemeral"
            key={resp.id}
          >
            <div className="discord-replied-message">
              <img
                src={msg.avatar_url || getRelativeUrl("/logo.svg")}
                alt=""
                className="discord-replied-message-avatar"
              />
              <span className="discord-application-tag">Bot</span>
              <span className="discord-replied-message-username">
                {msg.username || "Embed Generator"}
              </span>
              <div className="discord-replied-message-content truncate">
                {msg.content || (
                  <span className="italic">Click to see attachment</span>
                )}
              </div>
            </div>
            <div className="discord-message-inner">
              <div className="discord-author-avatar">
                <img src={getRelativeUrl("/logo.svg")} alt="" />
              </div>
              <div className="discord-message-content">
                <span className="discord-author-info">
                  <span className="discord-author-username">
                    Embed Generator
                  </span>
                  <span className="discord-application-tag">
                    <svg
                      className="discord-application-tag-verified"
                      aria-label="Verified Bot"
                      aria-hidden="false"
                      width="16"
                      height="16"
                      viewBox="0 0 16 15.2"
                    >
                      <path
                        d="M7.4,11.17,4,8.62,5,7.26l2,1.53L10.64,4l1.36,1Z"
                        fill="currentColor"
                      ></path>
                    </svg>
                    Bot
                  </span>
                </span>
                <span className="discord-message-timestamp pl-1">
                  Today at {currentTime}
                </span>
                <div className="discord-message-body">
                  <span className="discord-message-markup">{resp.text}</span>
                </div>
                <div className="discord-message-compact-indent">
                  <div className="discord-message-ephemeral flex items-center">
                    <svg
                      className="discord-message-ephemeral-icon"
                      aria-hidden="true"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill="currentColor"
                        d="M12 5C5.648 5 1 12 1 12C1 12 5.648 19 12 19C18.352 19 23 12 23 12C23 12 18.352 5 12 5ZM12 16C9.791 16 8 14.21 8 12C8 9.79 9.791 8 12 8C14.209 8 16 9.79 16 12C16 14.21 14.209 16 12 16Z"
                      ></path>
                      <path
                        fill="currentColor"
                        d="M12 14C13.1046 14 14 13.1046 14 12C14 10.8954 13.1046 10 12 10C10.8954 10 10 10.8954 10 12C10 13.1046 10.8954 14 12 14Z"
                      ></path>
                    </svg>
                    Only you can see this •{" "}
                    <span
                      className="discord-message-ephemeral-link"
                      onClick={() =>
                        setResponses(responses.filter((r) => r.id !== resp.id))
                      }
                    >
                      Dismiss message
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Twemoji>
  );
}

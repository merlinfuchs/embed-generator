import { format, parseISO } from "date-fns";
// @ts-ignore
import { toHTML } from "@/lib/utils/discordMarkdown";
import { Message } from "@/lib/schema/message";
import { colorIntToHex } from "@/lib/utils/color";
import Twemoji from "../common/Twemoji";

const buttonColors = {
  1: "discord-button-primary",
  2: "discord-button-secondary",
  3: "discord-button-success",
  4: "discord-button-destructive",
  5: "discord-button-secondary",
};

const defaultUsername = "Captain Hook";
const defaultAvatarUrl = "https://cdn.discordapp.com/embed/avatars/0.png";

export default function MessagePreview({ msg }: { msg: Message }) {
  const currentTime = format(new Date(), "hh:mm aa");

  return (
    <Twemoji
      options={{
        className: "discord-twemoji",
      }}
    >
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
                <span className="discord-application-tag">App</span>
              </span>
              <span className="discord-message-timestamp pl-1">
                Today at {currentTime}
              </span>
              {!!msg.content && (
                <div className="discord-message-body">
                  <div
                    className="discord-message-markup"
                    dangerouslySetInnerHTML={{
                      __html: toHTML(msg.content || "", {}),
                    }}
                  />
                </div>
              )}

              <div className="discord-message-compact-indent">
                {msg.embeds &&
                  msg.embeds.map((embed) => {
                    let inlineFieldIndex = 0;
                    const hexColor = embed.color
                      ? colorIntToHex(embed.color)
                      : "#1f2225";
                    let timestamp = "";
                    if (embed.timestamp) {
                      const date = parseISO(embed.timestamp);
                      if (!isNaN(date.getTime())) {
                        timestamp = format(date, "dd/MM/yyyy");
                      }
                    }
                    return (
                      <div
                        key={embed.id}
                        className="discord-embed overflow-hidden"
                      >
                        <div
                          className="discord-left-border"
                          style={{ backgroundColor: hexColor }}
                        ></div>
                        <div className="discord-embed-root">
                          <div className="discord-embed-wrapper">
                            <div className="discord-embed-grid">
                              {!!embed.provider?.name && (
                                <div className="discord-embed-provider overflow-hidden break-all">
                                  {embed.provider.url ? (
                                    <a href={embed.provider.url}>
                                      {embed.provider.name}
                                    </a>
                                  ) : (
                                    embed.provider.name
                                  )}
                                </div>
                              )}
                              {!!embed.author?.name && (
                                <div className="discord-embed-author overflow-hidden break-all">
                                  {!!embed.author.icon_url && (
                                    <img
                                      src={embed.author.icon_url}
                                      alt=""
                                      className="discord-author-image"
                                    />
                                  )}
                                  {embed.author.url ? (
                                    <a href={embed.author.url}>
                                      {embed.author.name}
                                    </a>
                                  ) : (
                                    embed.author.name
                                  )}
                                </div>
                              )}
                              {!!embed.title && (
                                <div className="discord-embed-title overflow-hidden break-all">
                                  {embed.url ? (
                                    <a
                                      href={embed.url}
                                      dangerouslySetInnerHTML={{
                                        __html: toHTML(embed.title || "", {
                                          isTitle: true,
                                        }),
                                      }}
                                    ></a>
                                  ) : (
                                    <span
                                      dangerouslySetInnerHTML={{
                                        __html: toHTML(embed.title || "", {
                                          isTitle: true,
                                        }),
                                      }}
                                    />
                                  )}
                                </div>
                              )}
                              {!!embed.description && (
                                <div
                                  className="discord-embed-description"
                                  dangerouslySetInnerHTML={{
                                    __html: toHTML(embed.description || "", {}),
                                  }}
                                />
                              )}
                              {!!embed.fields.length && (
                                <div className="discord-embed-fields">
                                  {embed.fields.map((field) => (
                                    <div
                                      key={field.id}
                                      className={`discord-embed-field${
                                        field.inline
                                          ? ` discord-embed-inline-field discord-embed-inline-field-${
                                              (inlineFieldIndex++ % 3) + 1
                                            }`
                                          : ""
                                      }`}
                                    >
                                      <div
                                        className="discord-field-title overflow-hidden break-all"
                                        dangerouslySetInnerHTML={{
                                          __html: toHTML(field.name || "", {
                                            isTitle: true,
                                          }),
                                        }}
                                      />
                                      <div
                                        dangerouslySetInnerHTML={{
                                          __html: toHTML(field.value, {}),
                                        }}
                                      />
                                    </div>
                                  ))}
                                </div>
                              )}
                              {!!embed.image && (
                                <div className="discord-embed-media">
                                  <img
                                    src={embed.image.url}
                                    alt=""
                                    className="discord-embed-image"
                                  />
                                </div>
                              )}
                              {!!embed.thumbnail && (
                                <img
                                  src={embed.thumbnail.url}
                                  alt=""
                                  className="discord-embed-thumbnail"
                                />
                              )}
                              {(embed.footer?.text || embed.timestamp) && (
                                <div className="discord-embed-footer overflow-hidden break-all">
                                  {embed.footer?.icon_url && (
                                    <img
                                      src={embed.footer?.icon_url}
                                      alt=""
                                      className="discord-footer-image"
                                    />
                                  )}
                                  {embed.footer?.text}
                                  {embed.footer?.text && embed.timestamp && (
                                    <div className="discord-footer-separator">
                                      •
                                    </div>
                                  )}
                                  <div className="flex-none">{timestamp}</div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                <div className="discord-attachments"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Twemoji>
  );
}

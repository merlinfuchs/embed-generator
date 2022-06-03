import useMessage from "../hooks/useMessage";
import "./Preview.css";

export default function Preview() {
  const [msg] = useMessage();

  return (
    <div>
      <div
        className="discord-messages"
        style={{ border: "none", whiteSpace: "pre-wrap" }}
      >
        <div className="discord-message">
          <div className="discord-message-inner">
            <div className="discord-author-avatar">
              <img src={msg.avatar_url} alt="" />
            </div>
            <div className="discord-message-content">
              <span className="discord-author-info">
                <span className="discord-author-username">
                  {msg.username || "Embed Generator"}
                </span>
                <span className="discord-application-tag">Bot</span>
              </span>
              <span className="discord-message-timestamp">25/12/2022</span>
              {!!msg.content && (
                <div className="discord-message-body">{msg.content || ""}</div>
              )}
              <div className="discord-message-compact-indent">
                {msg.embeds.map((embed) => {
                  let inlineFieldIndex = 0;
                  const hexColor = embed.color
                    ? "#" + embed.color.toString(16)
                    : "#1f2225";
                  return (
                    <div key={embed.id} className="discord-embed">
                      <div
                        className="discord-left-border"
                        style={{ backgroundColor: hexColor }}
                      ></div>
                      <div className="discord-embed-root">
                        <div className="discord-embed-wrapper">
                          <div className="discord-embed-grid">
                            {!!embed.author?.name && (
                              <div className="discord-embed-author">
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
                                  <span>{embed.author.name}</span>
                                )}
                              </div>
                            )}
                            {!!embed.title && (
                              <div className="discord-embed-title">
                                {embed.url ? (
                                  <a href={embed.url}>{embed.title}</a>
                                ) : (
                                  <span>{embed.title}</span>
                                )}
                              </div>
                            )}
                            {!!embed.description && (
                              <div className="discord-embed-description">
                                {embed.description}
                              </div>
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
                                    <div className="discord-field-title">
                                      {field.name}
                                    </div>
                                    {field.value}
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
                              <div className="discord-embed-footer">
                                {embed.footer?.icon_url && (
                                  <img
                                    src={embed.footer?.icon_url}
                                    alt=""
                                    className="discord-footer-image"
                                  />
                                )}
                                {embed.footer?.text}
                                {embed.footer?.text && embed.timestamp && (
                                  <span className="discord-footer-separator">
                                    •
                                  </span>
                                )}
                                {embed.timestamp}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

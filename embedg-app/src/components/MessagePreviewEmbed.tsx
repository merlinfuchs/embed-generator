import { format, parseISO } from "date-fns";
import type { MessageEmbed } from "../discord/schema";
// @ts-expect-error untyped
import { toHTML } from "../discord/markdown";
import { colorIntToHex } from "../util/discord";
import { usePreviewUrl } from "../state/attachments";
import { safeHref } from "../util/url";

/** A classic embed, the body of a message that isn't using Components V2. */
export default function MessagePreviewEmbed({
  embed,
}: {
  embed: MessageEmbed;
}) {
  const authorIcon = usePreviewUrl(embed.author?.icon_url);
  const image = usePreviewUrl(embed.image?.url);
  const thumbnail = usePreviewUrl(embed.thumbnail?.url);
  const footerIcon = usePreviewUrl(embed.footer?.icon_url);
  let inlineFieldIndex = 0;
  const hexColor = embed.color ? colorIntToHex(embed.color) : "#1f2225";
  const providerUrl = safeHref(embed.provider?.url);
  const authorUrl = safeHref(embed.author?.url);
  const titleUrl = safeHref(embed.url);
  let timestamp = "";
  if (embed.timestamp) {
    const date = parseISO(embed.timestamp);
    if (!Number.isNaN(date.getTime())) {
      timestamp = format(date, "dd/MM/yyyy");
    }
  }
  return (
    <div key={embed.id} className="discord-embed overflow-hidden">
      <div
        className="discord-left-border"
        style={{ backgroundColor: hexColor }}
      ></div>
      <div className="discord-embed-root">
        <div className="discord-embed-wrapper">
          <div className="discord-embed-grid">
            {!!embed.provider?.name && (
              <div className="discord-embed-provider overflow-hidden break-all">
                {providerUrl ? (
                  <a href={providerUrl}>{embed.provider.name}</a>
                ) : (
                  embed.provider.name
                )}
              </div>
            )}
            {!!embed.author?.name && (
              <div className="discord-embed-author overflow-hidden break-all">
                {!!authorIcon && (
                  <img
                    src={authorIcon}
                    alt=""
                    className="discord-author-image"
                  />
                )}
                {authorUrl ? (
                  <a href={authorUrl}>{embed.author.name}</a>
                ) : (
                  embed.author.name
                )}
              </div>
            )}
            {!!embed.title && (
              <div className="discord-embed-title overflow-hidden break-all">
                {titleUrl ? (
                  <a
                    href={titleUrl}
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
            {!!image && (
              <div className="discord-embed-media">
                <img src={image} alt="" className="discord-embed-image" />
              </div>
            )}
            {!!thumbnail && (
              <img src={thumbnail} alt="" className="discord-embed-thumbnail" />
            )}
            {(embed.footer?.text || embed.timestamp) && (
              <div className="discord-embed-footer overflow-hidden break-all">
                {footerIcon && (
                  <img
                    src={footerIcon}
                    alt=""
                    className="discord-footer-image"
                  />
                )}
                {embed.footer?.text}
                {embed.footer?.text && embed.timestamp && (
                  <div className="discord-footer-separator">•</div>
                )}
                <div className="flex-none">{timestamp}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

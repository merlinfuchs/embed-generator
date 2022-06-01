import {
  DiscordMessage,
  DiscordMessages,
  DiscordEmbed,
  DiscordEmbedDescription,
  DiscordEmbedFields,
  DiscordEmbedField,
  DiscordTime,
  DiscordEmbedFooter,
} from "@skyra/discord-components-react";
import useMessage from "../hooks/useMessage";

export default function Preview() {
  const [msg] = useMessage();

  return (
    <div>
      <DiscordMessages className="border-none">
        <DiscordMessage
          author="Embed Generator"
          bot={true}
          className="whitespace-pre-line"
        >
          <span>{msg.content || ""}</span>
          <DiscordEmbed
            slot="embeds"
            authorImage="/sapphire.png"
            authorName="Sapphire Developers"
            authorUrl="https://sapphirejs.dev"
            color="#0F52BA"
            embedTitle="Sapphire"
            image="/sapphire.png"
            thumbnail="/sapphire.png"
            url="https://sapphirejs.dev"
          >
            <DiscordEmbedDescription slot="description">
              Sapphire is a next-gen object-oriented
              <a
                target="_blank"
                rel="noopener noreferrer"
                href="https://discord.js.org/"
              >
                Discord.js
              </a>
              bot framework.
              <br />
              <br />
              Sapphire is a community driven framework that aims to give you all
              the features you need to make your Discord bot.
              <br />
              <br />
              With a history of many other Discord bot frameworks (both for
              NodeJS and other languages) to inspire Sapphire, it has become the
              ultimate modern experience of writing your code.
            </DiscordEmbedDescription>
            <DiscordEmbedFields slot="fields">
              <DiscordEmbedField fieldTitle="Created">
                <DiscordTime>1 year ago</DiscordTime>
              </DiscordEmbedField>
              <DiscordEmbedField fieldTitle="Installation">
                {" "}
                yarn add @sapphire/framework{" "}
              </DiscordEmbedField>
              <DiscordEmbedField fieldTitle="Key Features">
                <ul
                  style={{
                    paddingInlineStart: 20,
                    marginBlockStart: "0.5em",
                  }}
                >
                  <li>
                    <div>
                      <span></span>
                    </div>
                    <div>Advanced plugin support</div>
                  </li>
                  <li>
                    <div>
                      <span></span>
                    </div>
                    <div>Supports both CommonJS and ESM</div>
                  </li>
                  <li>
                    <div>
                      <span></span>
                    </div>
                    <div>Completely modular and extendable</div>
                  </li>
                  <li>
                    <div>
                      <span></span>
                    </div>
                    <div>
                      Designed with first class TypeScript support in mind
                    </div>
                  </li>
                  <li>
                    <div>
                      <span></span>
                    </div>
                    <div>
                      Includes optional utilities that you can use in any
                      project
                    </div>
                  </li>
                </ul>
              </DiscordEmbedField>
            </DiscordEmbedFields>
            <DiscordEmbedFooter
              slot="footer"
              footerImage="/sapphire.png"
              timestamp="03/20/2021"
            >
              Open source libraries to aid in the creation of Discord bots
            </DiscordEmbedFooter>
          </DiscordEmbed>
        </DiscordMessage>
      </DiscordMessages>
    </div>
  );
}

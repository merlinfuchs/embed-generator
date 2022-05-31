import {
  DiscordMessage,
  DiscordMessages,
  DiscordMention,
} from "@skyra/discord-components-react";

export default function Preview() {
  return (
    <div>
      <DiscordMessages>
        <DiscordMessage author="Alyx Vargas">
          {" "}
          Hey guys, I'm new here! Glad to be able to join you all!{" "}
        </DiscordMessage>
        <DiscordMessage author="Fenton Smart" avatar="/avafive.png">
          {" "}
          Hi, I'm new here too!{" "}
        </DiscordMessage>
        <DiscordMessage profile="maximillian">
          Hey, <DiscordMention>Alyx Vargas</DiscordMention> and{" "}
          <DiscordMention>Dawn</DiscordMention>. Welcome to our server!
          <br />
          Be sure to read through the{" "}
          <DiscordMention type="channel">rules</DiscordMention>. You can ping
          <DiscordMention type="role" color="#70f0b4">
            Support
          </DiscordMention>
          if you need help.
        </DiscordMessage>
        <DiscordMessage profile="willard">
          Hello everyone! How's it going?
        </DiscordMessage>
        <DiscordMessage author="Alyx Vargas">
          Thank you
          <DiscordMention highlight>Maximillian Osborn</DiscordMention>!
        </DiscordMessage>
        <DiscordMessage author="Kayla Feeney" avatar="/avafour.png">
          I'm doing well, <DiscordMention>Willard Walton</DiscordMention>. What
          about yourself?
        </DiscordMessage>
        <DiscordMessage profile="willard">
          {" "}
          s!8ball How am I doing today?{" "}
        </DiscordMessage>
        <DiscordMessage profile="skyra"> Yes. </DiscordMessage>
      </DiscordMessages>
    </div>
  );
}

import ToolsBackButton from "../../components/ToolsBackButton";
import ToolsSnowflake from "../../components/ToolsSnowflake";

const steps = [
  "In Discord, open Settings, then Advanced, and turn on Developer Mode.",
  "Right-click a user, server, channel, role or message and choose Copy ID.",
  "Paste the ID into the box above.",
];

const faq = [
  {
    q: "How do I see when a Discord account was created?",
    a: "Copy the user's ID and paste it above. The date it shows is when the account was created.",
  },
  {
    q: "Which IDs work?",
    a: "All of them: users, servers, channels, roles, messages, emojis and more. They are all made the same way, so each one holds the time it was created.",
  },
  {
    q: "Can I paste a mention or a link?",
    a: "Yes. A mention like <@123456789012345678> or a link to a message works, and a message link gives the ID of the message.",
  },
  {
    q: "Is anything sent to a server?",
    a: "No. The ID is decoded in your browser, nothing is uploaded.",
  },
];

export default function SnowflakeToolView() {
  return (
    <div className="overflow-y-auto w-full">
      <div className="flex flex-col max-w-5xl mx-auto px-4 w-full my-5 mb-20 lg:mt-20 space-y-20">
        <ToolsBackButton />
        <div>
          <div className="mb-10">
            <h1 className="text-white font-medium mb-3 text-2xl">
              Discord <span className="text-azure-400">Snowflake</span> Decoder
            </h1>
            <p className="text-mist-400 font-light text-sm">
              Every Discord ID holds the moment it was created. Paste an ID to
              see when that user, server, channel or message was made, or turn a
              date into an ID.
            </p>
          </div>
          <ToolsSnowflake />
        </div>

        <section>
          <h2 className="text-white font-medium mb-4 text-xl">
            How to find a Discord ID
          </h2>
          <ol className="list-decimal pl-5 space-y-2 text-mist-300 text-sm leading-relaxed">
            {steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </section>

        <section>
          <h2 className="text-white font-medium mb-4 text-xl">
            How Discord IDs work
          </h2>
          <p className="text-mist-400 font-light text-sm leading-relaxed">
            Discord IDs are called snowflakes. Each one is a 64-bit number. The
            first 42 bits are the milliseconds since 1 January 2015, the start
            of Discord's own calendar. The next 10 bits say which worker and
            process made the ID, and the last 12 count the IDs made in the same
            millisecond. That's why IDs from later times are always larger.
          </p>
        </section>

        <section>
          <h2 className="text-white font-medium mb-6 text-xl">Questions</h2>
          <dl className="grid gap-x-10 gap-y-6 md:grid-cols-2">
            {faq.map((f) => (
              <div key={f.q}>
                <dt className="text-mist-100 font-medium mb-2">{f.q}</dt>
                <dd className="text-mist-400 font-light text-sm leading-relaxed">
                  {f.a}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </div>
  );
}

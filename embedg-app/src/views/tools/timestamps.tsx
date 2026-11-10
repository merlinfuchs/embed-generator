import ToolsBackButton from "../../components/ToolsBackButton";
import ToolsTimestamps from "../../components/ToolsTimestamps";

const steps = [
  "Pick the date and time, and the timezone it's meant in.",
  "Find the format you want in the list. The example shows how it looks.",
  "Click the code next to it to copy it.",
  "Paste it into any Discord message and send it.",
];

const faq = [
  {
    q: "Why does everyone see a different time?",
    a: "Discord turns the timestamp into the time in each reader's own timezone and language, so it's right for everyone. Pick the time in your timezone and your members see it in theirs.",
  },
  {
    q: "Can I use a timestamp in an embed?",
    a: "Yes, in the description, in field values and in the message text. Titles, field names and footers don't show them, they stay as plain text.",
  },
  {
    q: "What does the relative time do?",
    a: 'It shows how far away the time is, like "in 3 hours" or "2 days ago", and counts along as time passes without anyone editing the message.',
  },
  {
    q: "Do I need a bot for timestamps?",
    a: "No. A timestamp is part of the message text, so anyone can send one from their own account.",
  },
];

export default function TimestampsToolView() {
  return (
    <div className="overflow-y-auto w-full">
      <div className="flex flex-col max-w-5xl mx-auto px-4 w-full my-5 mb-20 lg:mt-20 space-y-20">
        <ToolsBackButton />
        <div>
          <div className="mb-10">
            <h1 className="text-white font-medium mb-3 text-2xl">
              Discord <span className="text-azure-400">Timestamp</span>{" "}
              Generator
            </h1>
            <p className="text-mist-400 font-light text-sm">
              Pick a date and time to get a Discord timestamp that shows up
              differently for everyone, based on their own timezone. Copy the
              format you want and paste it into your message.
            </p>
          </div>
          <ToolsTimestamps />
        </div>

        <section>
          <h2 className="text-white font-medium mb-4 text-xl">
            How to add a timestamp to a Discord message
          </h2>
          <ol className="list-decimal pl-5 space-y-2 text-mist-300 text-sm leading-relaxed">
            {steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </section>

        <section>
          <h2 className="text-white font-medium mb-4 text-xl">
            How timestamps work
          </h2>
          <p className="text-mist-400 font-light text-sm leading-relaxed">
            A timestamp looks like{" "}
            <code className="text-mist-300">&lt;t:1794291300:F&gt;</code>. The
            number is the moment in seconds since 1 January 1970 (UTC), and the
            letter after it picks the format. Leave the letter out and Discord
            uses the short date and time.
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

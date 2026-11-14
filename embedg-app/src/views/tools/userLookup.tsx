import ToolsBackButton from "../../components/ToolsBackButton";
import ToolsUserLookup from "../../components/ToolsUserLookup";

const steps = [
  "In Discord, open Settings, then Advanced, and turn on Developer Mode.",
  "Right-click a user and choose Copy User ID.",
  "Log in with Discord here, paste the ID and press Look up.",
];

const faq = [
  {
    q: "Why do I have to log in?",
    a: "Discord only gives user details to bots, so the lookup runs on our server. Logging in lets us limit how many lookups each person can do, so it keeps working for everyone.",
  },
  {
    q: "What can I see about a user?",
    a: "What Discord shows publicly: the name, avatar, banner, accent color, badges and when the account was created. Emails, servers and messages are never shown.",
  },
  {
    q: "Can I look up any user?",
    a: "Yes, as long as you have the ID. The user doesn't need to share a server with you or with us, and they aren't told.",
  },
  {
    q: "Why is a badge missing?",
    a: "Only the badges Discord marks as public are shown. Some badges, like Nitro or server boosting, are not public.",
  },
  {
    q: "Do you keep the lookups?",
    a: "No. Results are held in memory for a few minutes so repeated lookups are fast, and are not stored.",
  },
];

export default function UserLookupToolView() {
  return (
    <div className="overflow-y-auto w-full">
      <div className="flex flex-col max-w-5xl mx-auto px-4 w-full my-5 mb-20 lg:mt-20 space-y-20">
        <ToolsBackButton />
        <div>
          <div className="mb-10">
            <h1 className="text-white font-medium mb-3 text-2xl">
              Discord <span className="text-azure-400">User</span> Lookup
            </h1>
            <p className="text-mist-400 font-light text-sm">
              Paste a Discord user ID to see the user's name, avatar, banner,
              badges and when their account was created.
            </p>
          </div>
          <ToolsUserLookup />
        </div>

        <section>
          <h2 className="text-white font-medium mb-4 text-xl">
            How to look up a Discord user
          </h2>
          <ol className="list-decimal pl-5 space-y-2 text-mist-300 text-sm leading-relaxed">
            {steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
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

import clsx from "clsx";
import ToolsColoredText, {
  ansiClass,
  backgroundColors,
  foregroundColors,
} from "../../components/ToolsColoredText";
import ToolsBackButton from "../../components/ToolsBackButton";

const steps = [
  "Type or paste your text into the box above.",
  "Select the words you want to color and click a text color in the top row or a background color in the bottom row. Bold and Underline work the same way.",
  "Click Copy Format to copy the result as an ANSI code block.",
  "Paste it into any Discord message and send it.",
];

const faq = [
  {
    q: "How do I make red text in Discord?",
    a: "Type your text above, select the part that should be red and click the red T in the top row. Copy it with Copy Format and paste it into your message.",
  },
  {
    q: "Do I need a bot for colored text?",
    a: "No. The colors are part of the message text, so anyone can send colored text from their own account in any channel.",
  },
  {
    q: "Can I color text outside a code block?",
    a: "No. Discord only colors text inside a code block marked as ansi. Normal message text can't be colored.",
  },
  {
    q: "Can I change colored text I copied before?",
    a: "Yes. Paste it into the box above and the colors come back, so you can change them and copy it again.",
  },
];

export default function ColoredTextToolView() {
  return (
    <div className="overflow-y-auto w-full">
      <div className="flex flex-col max-w-5xl mx-auto px-4 w-full my-5 mb-20 lg:mt-20 space-y-20">
        <ToolsBackButton />
        <div>
          <div className="mb-10">
            <h1 className="text-white font-medium mb-3 text-2xl">
              Discord <span className="text-azure-400">Colored</span> Text
              Generator
            </h1>
            <p className="text-mist-400 font-light text-sm">
              Discord supports colored text via ANSI color codes in code blocks.
              Pick text and background colors for any part of your message here,
              then copy and paste the result into Discord.
            </p>
          </div>
          <ToolsColoredText />
        </div>

        <section>
          <h2 className="text-white font-medium mb-4 text-xl">
            How to make colored text in Discord
          </h2>
          <ol className="list-decimal pl-5 space-y-2 text-mist-300 text-sm leading-relaxed">
            {steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </section>

        <section>
          <h2 className="text-white font-medium mb-4 text-xl">
            Text and background colors
          </h2>
          <p className="text-mist-400 font-light text-sm mb-6">
            Discord supports 8 text colors and 8 background colors, plus bold
            and underline. They can be combined, for example white text on an
            orange background.
          </p>
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h3 className="text-mist-100 font-medium mb-3">Text colors</h3>
              <ul className="grid grid-cols-2 gap-2 text-sm">
                {foregroundColors.map(({ code, name }) => (
                  <li key={code} className="flex items-center gap-3">
                    <span
                      className={clsx(
                        "flex h-7 w-9 items-center justify-center rounded-lg bg-ink-900 font-mono",
                        ansiClass(code),
                      )}
                    >
                      T
                    </span>
                    <span className="text-mist-300">{name}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-mist-100 font-medium mb-3">
                Background colors
              </h3>
              <ul className="grid grid-cols-2 gap-2 text-sm">
                {backgroundColors.map(({ code, name }) => (
                  <li key={code} className="flex items-center gap-3">
                    <span
                      className={clsx("h-7 w-9 rounded-lg", ansiClass(code))}
                    />
                    <span className="text-mist-300">{name}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-white font-medium mb-4 text-xl">
            How colored text works
          </h2>
          <p className="text-mist-400 font-light text-sm leading-relaxed">
            Discord renders ANSI escape codes inside code blocks that start with{" "}
            <code className="text-mist-300">```ansi</code>. Each colored part
            begins with an invisible escape character and a code like{" "}
            <code className="text-mist-300">[2;31m</code> for red, and ends with{" "}
            <code className="text-mist-300">[0m</code>. Most keyboards can't
            type the escape character, which is why a generator helps. The
            colors only show inside the code block, not in normal message text.
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

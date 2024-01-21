import ToolsColoredText from "../../components/ToolsColoredText";
import ToolsBackButton from "../../components/ToolsBackButton";

export default function ColoredTextToolView() {
  return (
    <div className="overflow-y-auto w-full">
      <div className="flex flex-col max-w-5xl mx-auto px-4 w-full my-5 mb-20 lg:mt-20 space-y-20">
        <ToolsBackButton />
        <div>
          <div className="mb-10">
            <h1 className="text-white font-medium mb-3 text-2xl">
              <span className="text-blurple">Colored</span>{" "}
              <span>Text Generator</span>
            </h1>
            <h2 className="text-gray-400 font-light text-sm">
              Discord supports colored text via ANSI color codes in code blocks.
              This tool makes it very simple to generate colored text that you
              can then use in your Discord message.
            </h2>
          </div>
          <ToolsColoredText />
        </div>
      </div>
    </div>
  );
}

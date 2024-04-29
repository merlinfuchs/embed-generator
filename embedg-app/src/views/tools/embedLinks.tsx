import ToolsBackButton from "../../components/ToolsBackButton";
import ToolsEmbedLinks from "../../components/ToolsEmbedLinks";

export default function EmbedLinksToolView() {
  return (
    <div className="overflow-y-auto w-full">
      <div className="flex flex-col max-w-5xl mx-auto px-4 w-full my-5 mb-20 lg:mt-20 space-y-20">
        <ToolsBackButton />
        <div>
          <div className="mb-10">
            <h1 className="text-white font-medium mb-3 text-2xl">
              Embed Links
            </h1>
            <h2 className="text-gray-400 font-light text-sm">
              Embed links are a way to share rich embeds with others without
              needing to send the actual embed. They only support a subset of
              the features of the actual embeds but can be send anywhere.
            </h2>
          </div>
          <ToolsEmbedLinks />
        </div>
      </div>
    </div>
  );
}

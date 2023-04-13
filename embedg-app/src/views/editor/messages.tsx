import { useState } from "react";
import EditorModal from "../../components/EditorModal";
import GuildOrUserSelect from "../../components/GuildOrUserSelect";
import GuildSelect from "../../components/GuildSelect";

export default function MessagesView() {
  const [source, setSource] = useState<string | null>(null);

  return (
    <EditorModal>
      <div className="p-4">
        <div className="uppercase text-gray-300 text-sm font-medium mb-1.5">
          Show Messages For
        </div>
        <div className="w-full max-w-md">
          <GuildOrUserSelect value={source} onChange={setSource} />
        </div>
      </div>
    </EditorModal>
  );
}

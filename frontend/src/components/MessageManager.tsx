import { MenuIcon, UploadIcon } from "@heroicons/react/outline";
import { useState } from "react";
import MessageSelect from "./MessageSelect";

export default function MessageManager() {
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);

  return <div></div>;

  return (
    <div className="flex-shrink-0 flex space-x-2">
      <div className="bg-dark-2 rounded flex items-center justify-center cursor-pointer px-3 hover:bg-dark-1">
        <MenuIcon className="w-5 h-5" />
        <div className="ml-3 hidden lg:block">Manage</div>
      </div>
      <div className="bg-dark-2 rounded flex items-center justify-center cursor-pointer px-3 hover:bg-dark-1">
        <UploadIcon className="w-5 h-5" />
        <div className="ml-3 hidden lg:block">Save</div>
      </div>
      <MessageSelect value={selectedMessage} onChange={setSelectedMessage} />
    </div>
  );
}

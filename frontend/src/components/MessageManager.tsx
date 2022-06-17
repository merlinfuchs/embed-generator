import { MenuIcon, UploadIcon } from "@heroicons/react/outline";
import { useEffect, useState } from "react";
import MessageManageModal from "./MessageManageModal";
import MessageSelect from "./MessageSelect";

export default function MessageManager() {
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!selectedMessage) return;
    window.confirm(
      "You are about to replace the current message with the loaded one!"
    );
  }, [selectedMessage]);

  return (
    <>
      <div className="flex-shrink-0 flex space-x-2">
        <div
          className="bg-dark-2 rounded flex items-center justify-center cursor-pointer px-3 hover:bg-dark-1"
          onClick={() => setVisible(true)}
        >
          <MenuIcon className="w-5 h-5" />
          <div className="ml-3 hidden lg:block">Messages</div>
        </div>
        {!!selectedMessage && (
          <div className="bg-dark-2 rounded flex items-center justify-center cursor-pointer px-3 hover:bg-dark-1">
            <UploadIcon className="w-5 h-5" />
            <div className="ml-3 hidden lg:block">Save</div>
          </div>
        )}
        <MessageSelect value={selectedMessage} onChange={setSelectedMessage} />
      </div>
      <MessageManageModal visible={visible} setVisible={setVisible} />
    </>
  );
}

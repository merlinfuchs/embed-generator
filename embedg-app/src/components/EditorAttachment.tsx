import { shallow } from "zustand/shallow";
import { useCurrentAttachmentsStore } from "../state/attachments";
import { TrashIcon } from "@heroicons/react/20/solid";
import { DocumentIcon } from "@heroicons/react/24/outline";

const isImageRegex = /^data:image\//;

interface Props {
  index: number;
  id: number;
}

export default function EditorAttachment({ index, id }: Props) {
  const [name, dataUrl] = useCurrentAttachmentsStore(
    (state) => [
      state.attachments[index].name,
      state.attachments[index].data_url,
    ],
    shallow
  );

  const [removeAttachment] = useCurrentAttachmentsStore(
    (state) => [state.removeAttachment],
    shallow
  );

  const isImage = isImageRegex.test(dataUrl);

  return (
    <div className="bg-dark-3 w-56 mr-3 mb-3 rounded space-y-2 p-2 overflow-none">
      <div className="flex items-center space-x-2">
        <input
          type="text"
          value={name}
          readOnly
          className="bg-dark-2 w-full no-ring rounded py-1 px-2 flex-auto text-white focus:outline-none"
        />
        <TrashIcon
          className="w-5 h-5 flex-none cursor-pointer text-gray-300"
          onClick={() => removeAttachment(index)}
        />
      </div>
      <div className="flex justify-center">
        {isImage ? (
          <img
            src={dataUrl}
            className="rounded h-full w-full max-h-56"
            alt=""
          />
        ) : (
          <DocumentIcon className="text-dark-7" />
        )}
      </div>
    </div>
  );
}

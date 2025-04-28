import { shallow } from "zustand/shallow";
import { useCurrentMessageStore } from "../state/message";
import EditorComponentBaseFile from "./EditorComponentBaseFile";

interface Props {
  rootIndex: number;
  rootId: number;
}

export default function EditorComponentFile({ rootIndex, rootId }: Props) {
  const file = useCurrentMessageStore((state) => state.getFile(rootIndex));
  const [
    updateFile,
    duplicateFile,
    moveComponentUp,
    moveComponentDown,
    deleteComponent,
  ] = useCurrentMessageStore(
    (state) => [
      state.updateComponent,
      state.duplicateComponent,
      state.moveComponentUp,
      state.moveComponentDown,
      state.deleteComponent,
    ],
    shallow
  );

  if (!file) {
    return null;
  }

  return (
    <div className="bg-dark-3 px-3 md:px-4 py-3 mb-3 rounded-md shadow">
      <EditorComponentBaseFile
        id={`components.${rootId}`}
        validationPathPrefix={`components.${rootIndex}`}
        data={file}
        onChange={(data) => updateFile(rootIndex, data)}
        duplicate={() => duplicateFile(rootIndex)}
        moveUp={() => moveComponentUp(rootIndex)}
        moveDown={() => moveComponentDown(rootIndex)}
        remove={() => deleteComponent(rootIndex)}
      />
    </div>
  );
}

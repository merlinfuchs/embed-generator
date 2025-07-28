import EditorComponentChildButton from "./EditorComponentActionRowButton";

export default function EditorComponentSectionAccessory({
  rootIndex,
  rootId,
}: {
  rootIndex: number;
  rootId: number;
}) {
  return (
    <div className="flex items-center space-x-2 mb-3">
      <div className="flex-1">
        <div className="text-sm text-gray-400">Accessory</div>
      </div>
      <EditorComponentChildButton
        rootIndex={rootIndex}
        rootId={rootId}
        childIndex={0}
        childId={0}
      />
    </div>
  );
}

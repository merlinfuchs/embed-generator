import {
  ChevronDownIcon,
  ChevronUpIcon,
  DocumentDuplicateIcon,
  TrashIcon,
} from "@heroicons/react/20/solid";
import {
  type EmbedFieldNode,
  type NodeId,
  useChildIds,
  useDocumentStore,
  useNode,
  useNodePath,
} from "../state/document";
import CheckBox from "./CheckBox";
import Collapsable from "./Collapsable";
import EditorInput from "./EditorInput";

interface Props {
  id: NodeId;
}

export default function EditorEmbedField({ id }: Props) {
  const field = useNode<EmbedFieldNode>(id);
  const path = useNodePath(id);

  const fieldIds = useChildIds(field?.parentId ?? "", "fields");
  const move = useDocumentStore((state) => state.move);
  const duplicate = useDocumentStore((state) => state.duplicate);
  const remove = useDocumentStore((state) => state.remove);
  const update = useDocumentStore((state) => state.update);

  const index = fieldIds.indexOf(id);

  if (!field) return null;

  return (
    <div className="border-2 border-dark-6 rounded-md p-3">
      <Collapsable
        id={`embeds.fields.${id}`}
        validationPathPrefix={path}
        title={`Field ${index + 1}`}
        extra={
          field.name && (
            <div className="text-gray-500 truncate flex space-x-2 pl-2">
              <div>-</div>
              <div className="truncate">{field.name}</div>
            </div>
          )
        }
        buttons={
          <div className="flex-none text-gray-300 flex items-center space-x-2">
            {index > 0 && (
              <ChevronUpIcon
                className="h-6 w-6 flex-none"
                role="button"
                onClick={() => move(id, -1)}
              />
            )}
            {index < fieldIds.length - 1 && (
              <ChevronDownIcon
                className="h-6 w-6 flex-none"
                role="button"
                onClick={() => move(id, 1)}
              />
            )}
            {fieldIds.length < 25 && (
              <DocumentDuplicateIcon
                className="h-5 w-5 flex-none"
                role="button"
                onClick={() => duplicate(id)}
              />
            )}
            <TrashIcon
              className="h-5 w-5 flex-none"
              role="button"
              onClick={() => remove(id)}
            />
          </div>
        }
      >
        <div className="space-y-3">
          <div className="flex space-x-3">
            <EditorInput
              label="Name"
              value={field.name}
              onChange={(v) => update<EmbedFieldNode>(id, { name: v })}
              maxLength={256}
              className="w-full"
              validationPath={`${path}.name`}
            />
            <div>
              <div className="uppercase text-gray-300 text-sm font-medium mb-1.5">
                Inline
              </div>
              <CheckBox
                checked={field.inline ?? false}
                height={10}
                onChange={(v) => update<EmbedFieldNode>(id, { inline: v })}
              />
            </div>
          </div>
          <EditorInput
            type="textarea"
            label="Value"
            value={field.value}
            onChange={(v) => update<EmbedFieldNode>(id, { value: v })}
            maxLength={1024}
            validationPath={`${path}.value`}
            controls={true}
          />
        </div>
      </Collapsable>
    </div>
  );
}

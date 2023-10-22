import {
  ChevronDownIcon,
  ChevronUpIcon,
  DocumentDuplicateIcon,
  TrashIcon,
} from "@heroicons/react/20/solid";
import { CustomCommandParameterWire } from "../api/wire";
import Collapsable from "./Collapsable";
import { getUniqueId } from "../util";
import EditorInput from "./EditorInput";

interface Props {
  cmdId: string;
  parameterIndex: number;
  parameters: CustomCommandParameterWire[];
  maxParameters: number;
  parameterCount: number;
  setParameters: (p: CustomCommandParameterWire[]) => void;
}

const parameterTypes: Record<number, string> = {
  0: "Text",
} as const;

export default function CustomCommandParameter({
  cmdId,
  parameters,
  parameterIndex,
  maxParameters,
  setParameters,
}: Props) {
  const parameter = parameters[parameterIndex];

  function moveUp() {
    const newParameters = [...parameters];
    newParameters.splice(
      parameterIndex - 1,
      0,
      newParameters.splice(parameterIndex, 1)[0]
    );
    setParameters(newParameters);
  }

  function moveDown() {
    const newParameters = [...parameters];
    newParameters.splice(
      parameterIndex + 1,
      0,
      newParameters.splice(parameterIndex, 1)[0]
    );
    setParameters(newParameters);
  }

  function duplicate() {
    const newParameters = [...parameters];
    newParameters.splice(parameterIndex, 0, {
      ...parameter,
      id: getUniqueId(),
    });
    setParameters(newParameters);
  }

  function remove() {
    const newParameters = [...parameters];
    newParameters.splice(parameterIndex, 1);
    setParameters(newParameters);
  }

  function setType(newType: string) {
    const newParameters = [...parameters];
    newParameters[parameterIndex].type = parseInt(newType);
    setParameters(newParameters);
  }

  function setName(newName: string) {
    const newParameters = [...parameters];
    newParameters[parameterIndex].name = newName;
    setParameters(newParameters);
  }

  function setDescription(newDescription: string) {
    const newParameters = [...parameters];
    newParameters[parameterIndex].description = newDescription;
    setParameters(newParameters);
  }

  return (
    <div className="p-3 border-2 border-dark-6 rounded-md">
      <Collapsable
        id={`command.${cmdId}.parameters.${parameter.id}`}
        title={`Argument ${parameterIndex + 1}`}
        buttons={
          <div className="flex-none text-gray-300 flex items-center space-x-2">
            {parameterIndex > 0 && (
              <ChevronUpIcon
                className="h-6 w-6 flex-none"
                role="button"
                onClick={moveUp}
              />
            )}
            {parameterIndex < parameters.length - 1 && (
              <ChevronDownIcon
                className="h-6 w-6 flex-none"
                role="button"
                onClick={moveDown}
              />
            )}
            {parameters.length < maxParameters && (
              <DocumentDuplicateIcon
                className="h-5 w-5 flex-none"
                role="button"
                onClick={duplicate}
              />
            )}
            <TrashIcon
              className="h-5 w-5 flex-none"
              role="button"
              onClick={remove}
            />
          </div>
        }
        extra={
          parameter.name ? (
            <div className="text-gray-500 truncate flex space-x-2 pl-2">
              <div>-</div>
              <div className="truncate">{parameter.name}</div>
            </div>
          ) : null
        }
      >
        <div className="space-y-4">
          <div className="flex flex-col space-y-3 lg:flex-row lg:space-x-3 lg:space-y-0">
            <div className="flex-none">
              <div className="mb-1.5 flex">
                <div className="uppercase text-gray-300 text-sm font-medium">
                  Type
                </div>
              </div>
              <select
                className="bg-dark-2 rounded p-2 w-full no-ring font-light cursor-pointer text-white"
                value={parameter.type.toString()}
                onChange={(v) => setType(v.target.value)}
              >
                <option value="3">Text</option>
                <option value="4">Whole Number</option>
                <option value="10">Decimal Number</option>
                <option value="5">True / False</option>
                <option value="6">User</option>
                <option value="7">Channel</option>
                <option value="8">Role</option>
                <option value="11">File</option>
              </select>
            </div>
          </div>
          <EditorInput
            label="Name"
            type="text"
            maxLength={32}
            value={parameter.name}
            onChange={setName}
          />
          <EditorInput
            label="Description"
            type="text"
            maxLength={100}
            value={parameter.description}
            onChange={setDescription}
          />
        </div>
      </Collapsable>
    </div>
  );
}

import { CustomCommandParameterWire } from "../api/wire";
import { getUniqueId } from "../util";
import { AutoAnimate } from "../util/autoAnimate";
import Collapsable from "./Collapsable";
import CustomCommandParameter from "./CustomCommandParameter";

interface Props {
  cmdId: string;
  parameters: CustomCommandParameterWire[];
  setParameters: (p: CustomCommandParameterWire[]) => void;
}

export default function CustomCommandParameters({
  cmdId,
  parameters,
  setParameters,
}: Props) {
  const maxParameters = 5;

  function add() {
    setParameters([
      ...parameters,
      {
        id: getUniqueId(),
        name: "",
        description: "",
        type: 3,
      },
    ]);
  }

  return (
    <Collapsable
      id={`command.${cmdId}.parameters`}
      validationPathPrefix={`actions.${cmdId}`}
      title="Arguments"
      extra={
        <div className="text-sm italic font-light text-gray-400">
          {parameters.length} / {maxParameters}
        </div>
      }
    >
      <AutoAnimate className="space-y-2">
        {parameters.map((p, i) => (
          <CustomCommandParameter
            cmdId={cmdId}
            parameterIndex={i}
            parameters={parameters}
            setParameters={setParameters}
            maxParameters={maxParameters}
            parameterCount={parameters.length}
            key={p.id}
          />
        ))}
      </AutoAnimate>
      <div className="space-x-3 mt-3 text-sm">
        {parameters.length < maxParameters ? (
          <button
            className="bg-blurple px-3 py-2 rounded transition-colors hover:bg-blurple-dark text-white"
            onClick={add}
          >
            Add Parameter
          </button>
        ) : (
          <button
            disabled
            className="bg-dark-2 px-3 py-2 rounded transition-colors cursor-not-allowed text-gray-300"
          >
            Add Parameter
          </button>
        )}
        <button
          className="px-3 py-2 rounded border-2 border-red hover:bg-red transition-colors text-white"
          onClick={() => setParameters([])}
        >
          Clear Parameter
        </button>
      </div>
    </Collapsable>
  );
}

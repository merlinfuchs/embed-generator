import {
  MessageComponentAccessory,
  MessageComponentButton,
  MessageComponentSection,
  MessageComponentTextDisplay,
  MessageComponentThumbnail,
} from "../discord/schema";
import { getUniqueId } from "../util";
import { AutoAnimate } from "../util/autoAnimate";
import Collapsable from "./Collapsable";
import EditorComponentBaseButton from "./EditorComponentBaseButton";
import EditorComponentBaseTextDisplay from "./EditorComponentBaseTextDisplay";
import EditorComponentBaseThumbnail from "./EditorcomponentBaseThumbnail";
import EditorComponentCollapsable from "./EditorComponentCollapsable";

interface Props {
  id: string;
  validationPathPrefix: string;
  title?: string;
  size?: "medium" | "large";
  data: MessageComponentSection;
  onChange: (data: Partial<MessageComponentSection>) => void;
  duplicate?: () => void;
  moveUp?: () => void;
  moveDown?: () => void;
  remove?: () => void;
  onAccessoryChange: (data: Partial<MessageComponentAccessory>) => void;
  addSubComponent: (component: MessageComponentTextDisplay) => void;
  clearSubComponents: () => void;
  moveSubComponentUp: (index: number) => void;
  moveSubComponentDown: (index: number) => void;
  deleteSubComponent: (index: number) => void;
  onSubComponentChange: (
    index: number,
    data: Partial<MessageComponentTextDisplay>
  ) => void;
  duplicateSubComponent: (index: number) => void;
}

export default function EditorComponentBaseSection({
  id,
  validationPathPrefix,
  title = "Section",
  size = "medium",
  data,
  onChange,
  duplicate,
  moveUp,
  moveDown,
  remove,
  onAccessoryChange,
  addSubComponent,
  clearSubComponents,
  moveSubComponentUp,
  moveSubComponentDown,
  deleteSubComponent,
  onSubComponentChange,
  duplicateSubComponent,
}: Props) {
  function onAccessoryTypeChange(type: number) {
    if (type === 11) {
      onAccessoryChange({
        id: getUniqueId(),
        type: 11,
        media: {
          url: "",
        },
      });
    } else if (type === 2) {
      onAccessoryChange({
        id: getUniqueId(),
        type: 2,
        label: "",
        style: 1,
        action_set_id: getUniqueId().toString(),
      });
    }
  }

  return (
    <EditorComponentCollapsable
      id={id}
      validationPathPrefix={validationPathPrefix}
      title={title}
      size={size}
      moveUp={moveUp}
      moveDown={moveDown}
      duplicate={duplicate}
      remove={remove}
      extra={
        <div className="text-gray-500 truncate flex space-x-2 pl-1">
          <div>-</div>
          <div className="truncate">Text</div>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <div className="mb-1.5 flex">
            <div className="uppercase text-gray-300 text-sm font-medium">
              Accessory Type
            </div>
          </div>
          <select
            className="bg-dark-2 rounded p-2 w-full no-ring font-light cursor-pointer text-white"
            value={data.accessory.type.toString()}
            onChange={(v) => onAccessoryTypeChange(parseInt(v.target.value))}
          >
            <option value="11">Thumbnail</option>
            <option value="2">Button</option>
          </select>
        </div>
        <div>
          {data.accessory.type === 11 ? (
            <div className="bg-dark-3 px-3 md:px-4 py-3 mb-3 rounded-md shadow border-2 border-dark-5">
              <EditorComponentBaseThumbnail
                id={`${id}.accessory`}
                title="Accessory"
                validationPathPrefix={`${validationPathPrefix}.accessory`}
                data={data.accessory}
                onChange={(data) => onAccessoryChange(data)}
              />
            </div>
          ) : (
            <EditorComponentBaseButton
              id={`${id}.accessory`}
              title="Accessory"
              validationPathPrefix={`${validationPathPrefix}.accessory`}
              data={data.accessory}
              onChange={(data) => onAccessoryChange(data)}
            />
          )}
        </div>

        <Collapsable
          id={`${id}.components`}
          validationPathPrefix={`${validationPathPrefix}.components`}
          title="Components"
          extra={
            <div className="text-sm italic font-light text-gray-400">
              {data.components.length} / 3
            </div>
          }
        >
          <AutoAnimate>
            {data.components.map((child, i) => (
              <div
                className="bg-dark-3 px-3 md:px-4 py-3 mb-3 rounded-md shadow border-2 border-dark-5"
                key={child.id}
              >
                <EditorComponentBaseTextDisplay
                  id={`${id}.components.${child.id}`}
                  validationPathPrefix={`${validationPathPrefix}.components.${i}`}
                  data={child}
                  onChange={(data) => onSubComponentChange(i, data)}
                  duplicate={
                    data.components.length < 3
                      ? () => duplicateSubComponent(i)
                      : undefined
                  }
                  moveUp={i > 0 ? () => moveSubComponentUp(i) : undefined}
                  moveDown={
                    i < data.components.length - 1
                      ? () => moveSubComponentDown(i)
                      : undefined
                  }
                  remove={() => deleteSubComponent(i)}
                />
              </div>
            ))}
            <div>
              <div className="space-x-3 mt-3">
                {data.components.length < 3 ? (
                  <button
                    className="bg-blurple px-3 py-2 rounded transition-colors hover:bg-blurple-dark text-white"
                    onClick={() =>
                      addSubComponent({
                        id: getUniqueId(),
                        type: 10,
                        content: "",
                      })
                    }
                  >
                    Add Text
                  </button>
                ) : (
                  <button
                    disabled
                    className="bg-dark-2 px-3 py-2 rounded transition-colors cursor-not-allowed text-gray-300"
                  >
                    Add Text
                  </button>
                )}
                <button
                  className="px-3 py-2 rounded border-2 border-red hover:bg-red transition-colors text-white"
                  onClick={clearSubComponents}
                >
                  Clear Texts
                </button>
              </div>
            </div>
          </AutoAnimate>
        </Collapsable>
      </div>
    </EditorComponentCollapsable>
  );
}

import {
  MessageComponentContainer,
  MessageComponentContainerSubComponent,
} from "../discord/schema";
import { getUniqueId } from "../util";
import { AutoAnimate } from "../util/autoAnimate";
import EditorComponentCollapsable from "./EditorComponentCollapsable";

interface Props {
  id: string;
  validationPathPrefix: string;
  title?: string;
  data: MessageComponentContainer;
  onChange: (data: Partial<MessageComponentContainer>) => void;
  duplicate: () => void;
  moveUp: () => void;
  moveDown: () => void;
  remove: () => void;
  addSubComponent: (component: MessageComponentContainerSubComponent) => void;
  clearSubComponents: () => void;
  moveSubComponentUp: (index: number) => void;
  moveSubComponentDown: (index: number) => void;
  deleteSubComponent: (index: number) => void;
  duplicateSubComponent: (index: number) => void;
  onSubComponentChange: (
    index: number,
    data: Partial<MessageComponentContainerSubComponent>
  ) => void;
}

export default function EditorComponentBaseContainer({
  id,
  validationPathPrefix,
  title = "Container",
  data,
  duplicate,
  moveUp,
  moveDown,
  remove,
  addSubComponent,
  clearSubComponents,
  moveSubComponentUp,
  moveSubComponentDown,
  deleteSubComponent,
  duplicateSubComponent,
  onSubComponentChange,
}: Props) {
  // TODO: implement editing of accessory

  return (
    <div className="bg-dark-3 p-3 rounded-md">
      <EditorComponentCollapsable
        id={id}
        validationPathPrefix={validationPathPrefix}
        title={title}
        size="large"
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
        <AutoAnimate>
          {data.components.map((child, i) => (
            <div
              className="bg-dark-3 px-3 md:px-4 py-3 mb-3 rounded-md shadow border-2 border-dark-5"
              key={child.id}
            ></div>
          ))}
          <div>
            <div className="space-x-3 mt-3">
              {data.components.length < 5 ? (
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
      </EditorComponentCollapsable>
    </div>
  );
}

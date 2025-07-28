import { useMemo } from "react";
import {
  MessageComponentAccessory,
  MessageComponentButton,
  MessageComponentContainer,
  MessageComponentContainerSubComponent,
  MessageComponentMediaGalleryItem,
  MessageComponentSelectMenu,
  MessageComponentSelectMenuOption,
  MessageComponentTextDisplay,
} from "../discord/schema";
import { getUniqueId } from "../util";
import { AutoAnimate } from "../util/autoAnimate";
import CheckBox from "./CheckBox";
import EditorComponentAddDropdown from "./EditorComponentAddDropdown";
import EditorComponentBaseActionRow from "./EditorComponentBaseActionRow";
import EditorComponentBaseFile from "./EditorComponentBaseFile";
import EditorComponentBaseMediaGallery from "./EditorComponentBaseMediaGallery";
import EditorComponentBaseSection from "./EditorComponentBaseSection";
import EditorComponentBaseSeparator from "./EditorComponentBaseSeparator";
import EditorComponentBaseTextDisplay from "./EditorComponentBaseTextDisplay";
import EditorComponentCollapsable from "./EditorComponentCollapsable";
import EditorInput from "./EditorInput";
import { colorIntToHex } from "../util/discord";
import ColorPicker from "./ColorPicker";
import ValidationError from "./ValidationError";
import Collapsable from "./Collapsable";

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

  actionRowAddSubComponent: (
    index: number,
    comp: MessageComponentButton | MessageComponentSelectMenu
  ) => void;
  actionRowClearSubComponents: (a: number) => void;
  actionRowMoveSubComponentUp: (a: number, k: number) => void;
  actionRowMoveSubComponentDown: (a: number, k: number) => void;
  actionRowDeleteSubComponent: (a: number, k: number) => void;
  actionRowDuplicateSubComponent: (a: number, k: number) => void;
  actionRowOnSubComponentChange: (
    a: number,
    k: number,
    data: Partial<MessageComponentButton | MessageComponentSelectMenu>
  ) => void;
  actionRowAddSelectMenuOption: (a: number, k: number) => void;
  actionRowOnSelectMenuOptionChange: (
    a: number,
    k: number,
    o: number,
    data: Partial<MessageComponentSelectMenuOption>
  ) => void;
  actionRowDuplicateSelectMenuOption: (a: number, k: number, o: number) => void;
  actionRowMoveSelectMenuOptionUp: (a: number, k: number, o: number) => void;
  actionRowMoveSelectMenuOptionDown: (a: number, k: number, o: number) => void;
  actionRowRemoveSelectMenuOption: (a: number, k: number, o: number) => void;
  actionRowClearSelectMenuOptions: (a: number, k: number) => void;

  sectionOnAccessoryChange: (
    i: number,
    data: Partial<MessageComponentAccessory>
  ) => void;
  sectionAddSubComponent: (
    s: number,
    comp: MessageComponentTextDisplay
  ) => void;
  sectionClearSubComponents: (s: number) => void;
  sectionMoveSubComponentUp: (s: number, k: number) => void;
  sectionMoveSubComponentDown: (s: number, k: number) => void;
  sectionDeleteSubComponent: (s: number, k: number) => void;
  sectionOnSubComponentChange: (
    s: number,
    k: number,
    data: Partial<MessageComponentContainerSubComponent>
  ) => void;
  sectionDuplicateSubComponent: (s: number, k: number) => void;

  mediaGalleryAddItem: (
    a: number,
    comp: MessageComponentMediaGalleryItem
  ) => void;
  mediaGalleryClearItems: (a: number) => void;
  mediaGalleryMoveItemUp: (a: number, i: number) => void;
  mediaGalleryMoveItemDown: (a: number, i: number) => void;
  mediaGalleryDeleteItem: (a: number, i: number) => void;
  mediaGalleryOnItemChange: (
    a: number,
    i: number,
    data: Partial<MessageComponentContainerSubComponent>
  ) => void;
  mediaGalleryDuplicateItem: (a: number, i: number) => void;
}

export default function EditorComponentBaseContainer({
  id,
  validationPathPrefix,
  title = "Container",
  data,
  onChange,
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

  actionRowAddSubComponent,
  actionRowClearSubComponents,
  actionRowMoveSubComponentUp,
  actionRowMoveSubComponentDown,
  actionRowDeleteSubComponent,
  actionRowDuplicateSubComponent,
  actionRowOnSubComponentChange,
  actionRowAddSelectMenuOption,
  actionRowOnSelectMenuOptionChange,
  actionRowDuplicateSelectMenuOption,
  actionRowMoveSelectMenuOptionUp,
  actionRowMoveSelectMenuOptionDown,
  actionRowRemoveSelectMenuOption,
  actionRowClearSelectMenuOptions,

  sectionOnAccessoryChange,
  sectionAddSubComponent,
  sectionClearSubComponents,
  sectionMoveSubComponentUp,
  sectionMoveSubComponentDown,
  sectionDeleteSubComponent,
  sectionOnSubComponentChange,
  sectionDuplicateSubComponent,

  mediaGalleryAddItem,
  mediaGalleryClearItems,
  mediaGalleryMoveItemUp,
  mediaGalleryMoveItemDown,
  mediaGalleryDeleteItem,
  mediaGalleryOnItemChange,
  mediaGalleryDuplicateItem,
}: Props) {
  const hexColor = useMemo(
    () =>
      data.accent_color !== undefined
        ? colorIntToHex(data.accent_color)
        : "#1f2225",
    [data.accent_color]
  );

  return (
    <div
      className="bg-dark-3 p-3 rounded-md border-l-4"
      style={{ borderColor: hexColor }}
    >
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
        <div className="space-y-4 mb-4">
          <div className="flex space-x-3">
            <div className="flex-auto">
              <div className="uppercase text-gray-300 text-sm font-medium mb-1.5">
                Color
              </div>
              <ColorPicker
                value={data.accent_color}
                onChange={(v) =>
                  onChange({
                    accent_color: v,
                  })
                }
              />
              <ValidationError path={`${validationPathPrefix}.accent_color`} />
            </div>
            <div className="flex-none">
              <div className="uppercase text-gray-300 text-sm font-medium mb-1.5">
                Spoiler
              </div>
              <CheckBox
                checked={data.spoiler ?? false}
                onChange={(v) =>
                  onChange({
                    spoiler: v,
                  })
                }
              />
            </div>
          </div>
        </div>

        <Collapsable
          id={`${id}.components`}
          validationPathPrefix={`${validationPathPrefix}.components`}
          title="Components"
          extra={
            <div className="text-sm italic font-light text-gray-400">
              {data.components.length} / 10
            </div>
          }
        >
          <AutoAnimate>
            {data.components.map((child, i) => (
              <div
                className="bg-dark-3 px-3 md:px-4 py-3 mb-3 rounded-md shadow border-2 border-dark-5"
                key={child.id}
              >
                {child.type === 1 ? (
                  <EditorComponentBaseActionRow
                    id={`${id}.components.${child.id}`}
                    validationPathPrefix={`${validationPathPrefix}.components.${i}`}
                    data={child}
                    duplicate={
                      data.components.length < 10
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
                    addSubComponent={(comp) => {
                      actionRowAddSubComponent(i, comp);
                    }}
                    clearSubComponents={() => {
                      actionRowClearSubComponents(i);
                    }}
                    moveSubComponentUp={(index) => {
                      actionRowMoveSubComponentUp(i, index);
                    }}
                    moveSubComponentDown={(index) => {
                      actionRowMoveSubComponentDown(i, index);
                    }}
                    deleteSubComponent={(index) => {
                      actionRowDeleteSubComponent(i, index);
                    }}
                    onSubComponentChange={(index, data) => {
                      actionRowOnSubComponentChange(i, index, data);
                    }}
                    duplicateSubComponent={(index) => {
                      actionRowDuplicateSubComponent(i, index);
                    }}
                    onSelectMenuOptionChange={(index, optionIndex, data) => {
                      actionRowOnSelectMenuOptionChange(
                        i,
                        index,
                        optionIndex,
                        data
                      );
                    }}
                    addSelectMenuOption={(k) => {
                      actionRowAddSelectMenuOption(i, k);
                    }}
                    duplicateSelectMenuOption={(k, o) => {
                      actionRowDuplicateSelectMenuOption(i, k, o);
                    }}
                    moveSelectMenuOptionUp={(k, o) => {
                      actionRowMoveSelectMenuOptionUp(i, k, o);
                    }}
                    moveSelectMenuOptionDown={(k, o) => {
                      actionRowMoveSelectMenuOptionDown(i, k, o);
                    }}
                    removeSelectMenuOption={(k, o) => {
                      actionRowRemoveSelectMenuOption(i, k, o);
                    }}
                    clearSelectMenuOptions={(k) => {
                      actionRowClearSelectMenuOptions(i, k);
                    }}
                  />
                ) : child.type === 9 ? (
                  <EditorComponentBaseSection
                    id={`${id}.components.${child.id}`}
                    validationPathPrefix={`${validationPathPrefix}.components.${i}`}
                    data={child}
                    onChange={(data) => onSubComponentChange(i, data)}
                    duplicate={
                      data.components.length < 10
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
                    onAccessoryChange={(data) => {
                      sectionOnAccessoryChange(i, data);
                    }}
                    addSubComponent={(comp) => {
                      sectionAddSubComponent(i, comp);
                    }}
                    clearSubComponents={() => {
                      sectionClearSubComponents(i);
                    }}
                    moveSubComponentUp={(index) => {
                      sectionMoveSubComponentUp(i, index);
                    }}
                    moveSubComponentDown={(index) => {
                      sectionMoveSubComponentDown(i, index);
                    }}
                    deleteSubComponent={(index) => {
                      sectionDeleteSubComponent(i, index);
                    }}
                    onSubComponentChange={(index, data) => {
                      sectionOnSubComponentChange(i, index, data);
                    }}
                    duplicateSubComponent={(index) => {
                      sectionDuplicateSubComponent(i, index);
                    }}
                  />
                ) : child.type === 10 ? (
                  <EditorComponentBaseTextDisplay
                    id={`${id}.components.${child.id}`}
                    validationPathPrefix={`${validationPathPrefix}.components.${i}`}
                    data={child}
                    onChange={(data) => onSubComponentChange(i, data)}
                    duplicate={
                      data.components.length < 10
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
                ) : child.type === 12 ? (
                  <EditorComponentBaseMediaGallery
                    id={`${id}.components.${child.id}`}
                    validationPathPrefix={`${validationPathPrefix}.components.${i}`}
                    data={child}
                    duplicate={
                      data.components.length < 10
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
                    addItem={(comp) => {
                      mediaGalleryAddItem(i, comp);
                    }}
                    clearItems={() => {
                      mediaGalleryClearItems(i);
                    }}
                    moveItemUp={(index) => {
                      mediaGalleryMoveItemUp(i, index);
                    }}
                    moveItemDown={(index) => {
                      mediaGalleryMoveItemDown(i, index);
                    }}
                    deleteItem={(index) => {
                      mediaGalleryDeleteItem(i, index);
                    }}
                    onItemChange={(index, data) => {
                      mediaGalleryOnItemChange(i, index, data);
                    }}
                    duplicateItem={(index) => {
                      mediaGalleryDuplicateItem(i, index);
                    }}
                  />
                ) : child.type === 13 ? (
                  <EditorComponentBaseFile
                    id={`${id}.components.${child.id}`}
                    validationPathPrefix={`${validationPathPrefix}.components.${i}`}
                    data={child}
                    onChange={(data) => onSubComponentChange(i, data)}
                    duplicate={
                      data.components.length < 10
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
                ) : child.type === 14 ? (
                  <EditorComponentBaseSeparator
                    id={`${id}.components.${child.id}`}
                    validationPathPrefix={`${validationPathPrefix}.components.${i}`}
                    data={child}
                    onChange={(data) => onSubComponentChange(i, data)}
                    duplicate={
                      data.components.length < 10
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
                ) : (
                  <div>Not implemented</div>
                )}
              </div>
            ))}
            <div>
              <div className="flex space-x-3 mt-3 items-center">
                <EditorComponentAddDropdown
                  context="container"
                  addComponent={(comp) => {
                    if (
                      comp.type === 1 ||
                      comp.type === 9 ||
                      comp.type === 10 ||
                      comp.type === 12 ||
                      comp.type === 13 ||
                      comp.type === 14
                    ) {
                      addSubComponent(comp);
                    }
                  }}
                  disabled={data.components.length >= 10}
                />
                <button
                  className="px-3 py-2 rounded border-2 border-red hover:bg-red transition-colors text-white"
                  onClick={clearSubComponents}
                >
                  Clear Components
                </button>
              </div>
            </div>
          </AutoAnimate>
        </Collapsable>
      </EditorComponentCollapsable>
    </div>
  );
}

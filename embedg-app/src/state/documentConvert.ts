import type {
  EmbedField,
  Message,
  MessageComponent,
  MessageComponentAccessory,
  MessageComponentActionRow,
  MessageComponentButton,
  MessageComponentContainer,
  MessageComponentContainerSubComponent,
  MessageComponentFile,
  MessageComponentMediaGallery,
  MessageComponentMediaGalleryItem,
  MessageComponentSection,
  MessageComponentSelectMenu,
  MessageComponentSelectMenuOption,
  MessageComponentSeparator,
  MessageComponentTextDisplay,
  MessageComponentThumbnail,
  MessageEmbed,
} from "../discord/schema";
import { getUniqueId } from "../util";
import type { DocumentData, Node, NodeId } from "./document";

/** Names the array on the parent that a child sits in. */
export type ChildSlot =
  | "embeds"
  | "components"
  | "fields"
  | "options"
  | "items"
  | "accessory";

export function childSlots(node: Node): ChildSlot[] {
  switch (node.type) {
    case "message":
      return ["embeds", "components"];
    case "embed":
      return ["fields"];
    case "actionRow":
    case "container":
      return ["components"];
    case "section":
      return ["components", "accessory"];
    case "selectMenu":
      return ["options"];
    case "mediaGallery":
      return ["items"];
    default:
      return [];
  }
}

export function childIds(node: Node | undefined, slot: ChildSlot): NodeId[] {
  if (!node) return [];

  switch (node.type) {
    case "message":
      if (slot === "embeds") return node.embedIds;
      if (slot === "components") return node.componentIds;
      return [];
    case "embed":
      return slot === "fields" ? node.fieldIds : [];
    case "actionRow":
    case "container":
      return slot === "components" ? node.childIds : [];
    case "section":
      if (slot === "components") return node.childIds;
      if (slot === "accessory")
        return node.accessoryId ? [node.accessoryId] : [];
      return [];
    case "selectMenu":
      return slot === "options" ? node.optionIds : [];
    case "mediaGallery":
      return slot === "items" ? node.itemIds : [];
    default:
      return [];
  }
}

export function setChildIds(node: Node, slot: ChildSlot, ids: NodeId[]) {
  switch (node.type) {
    case "message":
      if (slot === "embeds") node.embedIds = ids;
      if (slot === "components") node.componentIds = ids;
      return;
    case "embed":
      if (slot === "fields") node.fieldIds = ids;
      return;
    case "actionRow":
    case "container":
      if (slot === "components") node.childIds = ids;
      return;
    case "section":
      if (slot === "components") node.childIds = ids;
      if (slot === "accessory") node.accessoryId = ids[0] ?? null;
      return;
    case "selectMenu":
      if (slot === "options") node.optionIds = ids;
      return;
    case "mediaGallery":
      if (slot === "items") node.itemIds = ids;
      return;
    default:
  }
}

export function fromMessage(message: Message): DocumentData {
  const nodes: Record<NodeId, Node> = {};

  function nodeId(): NodeId {
    let id = getUniqueId().toString();
    while (nodes[id]) {
      id = getUniqueId().toString();
    }
    // Reserve the id, the caller fills the node in once its children are built.
    nodes[id] = undefined as unknown as Node;
    return id;
  }

  function addField(field: EmbedField, parentId: NodeId): NodeId {
    const id = nodeId();
    nodes[id] = {
      type: "embedField",
      id,
      parentId,
      discordId: field.id,
      name: field.name,
      value: field.value,
      inline: field.inline,
    };
    return id;
  }

  function addEmbed(embed: MessageEmbed, parentId: NodeId): NodeId {
    const id = nodeId();
    const fieldIds = embed.fields.map((field) => addField(field, id));
    nodes[id] = {
      type: "embed",
      id,
      parentId,
      discordId: embed.id,
      title: embed.title,
      description: embed.description,
      url: embed.url,
      timestamp: embed.timestamp,
      color: embed.color,
      footer: embed.footer,
      author: embed.author,
      provider: embed.provider,
      image: embed.image,
      thumbnail: embed.thumbnail,
      fieldIds,
    };
    return id;
  }

  function addOption(
    option: MessageComponentSelectMenuOption,
    parentId: NodeId,
  ): NodeId {
    const id = nodeId();
    nodes[id] = {
      type: "selectOption",
      id,
      parentId,
      discordId: option.id,
      label: option.label,
      description: option.description,
      emoji: option.emoji,
      action_set_id: option.action_set_id,
    };
    return id;
  }

  function addGalleryItem(
    item: MessageComponentMediaGalleryItem,
    parentId: NodeId,
  ): NodeId {
    const id = nodeId();
    nodes[id] = {
      type: "mediaGalleryItem",
      id,
      parentId,
      discordId: item.id,
      media: item.media,
      description: item.description,
      spoiler: item.spoiler,
    };
    return id;
  }

  function addComponent(
    component: MessageComponent | MessageComponentAccessory,
    parentId: NodeId,
  ): NodeId {
    const id = nodeId();

    switch (component.type) {
      case 1: {
        const childIds = component.components.map((child) =>
          addComponent(child, id),
        );
        nodes[id] = {
          type: "actionRow",
          id,
          parentId,
          discordId: component.id,
          childIds,
        };
        break;
      }
      case 2:
        nodes[id] = {
          type: "button",
          id,
          parentId,
          discordId: component.id,
          style: component.style,
          label: component.label,
          emoji: component.emoji,
          url: component.style === 5 ? component.url : undefined,
          disabled: component.disabled,
          action_set_id: component.action_set_id,
        };
        break;
      case 3: {
        const optionIds = component.options.map((option) =>
          addOption(option, id),
        );
        nodes[id] = {
          type: "selectMenu",
          id,
          parentId,
          discordId: component.id,
          placeholder: component.placeholder,
          disabled: component.disabled,
          optionIds,
        };
        break;
      }
      case 9: {
        const childIds = component.components.map((child) =>
          addComponent(child, id),
        );
        const accessoryId = addComponent(component.accessory, id);
        nodes[id] = {
          type: "section",
          id,
          parentId,
          discordId: component.id,
          childIds,
          accessoryId,
        };
        break;
      }
      case 10:
        nodes[id] = {
          type: "textDisplay",
          id,
          parentId,
          discordId: component.id,
          content: component.content,
        };
        break;
      case 11:
        nodes[id] = {
          type: "thumbnail",
          id,
          parentId,
          discordId: component.id,
          media: component.media,
          description: component.description,
          spoiler: component.spoiler,
        };
        break;
      case 12: {
        const itemIds = component.items.map((item) => addGalleryItem(item, id));
        nodes[id] = {
          type: "mediaGallery",
          id,
          parentId,
          discordId: component.id,
          itemIds,
        };
        break;
      }
      case 13:
        nodes[id] = {
          type: "file",
          id,
          parentId,
          discordId: component.id,
          file: component.file,
          spoiler: component.spoiler,
        };
        break;
      case 14:
        nodes[id] = {
          type: "separator",
          id,
          parentId,
          discordId: component.id,
          divider: component.divider,
          spacing: component.spacing,
        };
        break;
      case 17: {
        const childIds = component.components.map((child) =>
          addComponent(child, id),
        );
        nodes[id] = {
          type: "container",
          id,
          parentId,
          discordId: component.id,
          accent_color: component.accent_color,
          spoiler: component.spoiler,
          childIds,
        };
        break;
      }
    }

    return id;
  }

  const rootId = nodeId();
  const embedIds = message.embeds.map((embed) => addEmbed(embed, rootId));
  const componentIds = message.components.map((component) =>
    addComponent(component, rootId),
  );

  nodes[rootId] = {
    type: "message",
    id: rootId,
    parentId: null,
    discordId: getUniqueId(),
    content: message.content,
    username: message.username,
    avatar_url: message.avatar_url,
    tts: message.tts,
    thread_name: message.thread_name,
    flags: message.flags,
    allowed_mentions: message.allowed_mentions,
    embedIds,
    componentIds,
  };

  return { nodes, rootId, actions: message.actions };
}

export interface ConvertedMessage {
  message: Message;
  /** `"embeds.0.fields.2"` and the like, as used by the validation store. */
  pathToId: Map<string, NodeId>;
  idToPath: Map<NodeId, string>;
}

const cache = new WeakMap<
  Record<NodeId, Node>,
  { state: DocumentData; converted: ConvertedMessage }
>();

/**
 * Builds the Discord payload from the document, along with the mapping between
 * node ids and the zod issue paths for that payload. Memoized on the `nodes`
 * object, which immer replaces on every change.
 */
export function toMessage(state: DocumentData): ConvertedMessage {
  const cached = cache.get(state.nodes);
  if (
    cached &&
    cached.state.rootId === state.rootId &&
    cached.state.actions === state.actions
  ) {
    return cached.converted;
  }

  const pathToId = new Map<string, NodeId>();
  const idToPath = new Map<NodeId, string>();

  function record(id: NodeId, path: string) {
    pathToId.set(path, id);
    idToPath.set(id, path);
  }

  function node(id: NodeId): Node | undefined {
    return state.nodes[id];
  }

  function embedField(id: NodeId, path: string): EmbedField {
    const field = node(id);
    if (field?.type !== "embedField") throw new Error(`not a field: ${id}`);

    record(id, path);
    return {
      id: field.discordId,
      name: field.name,
      value: field.value,
      inline: field.inline,
    };
  }

  function embed(id: NodeId, path: string): MessageEmbed {
    const embedNode = node(id);
    if (embedNode?.type !== "embed") throw new Error(`not an embed: ${id}`);

    record(id, path);
    return {
      id: embedNode.discordId,
      title: embedNode.title,
      description: embedNode.description,
      url: embedNode.url,
      timestamp: embedNode.timestamp,
      color: embedNode.color,
      footer: embedNode.footer,
      author: embedNode.author,
      provider: embedNode.provider,
      image: embedNode.image,
      thumbnail: embedNode.thumbnail,
      fields: embedNode.fieldIds.map((fieldId, i) =>
        embedField(fieldId, `${path}.fields.${i}`),
      ),
    };
  }

  function selectOption(
    id: NodeId,
    path: string,
  ): MessageComponentSelectMenuOption {
    const option = node(id);
    if (option?.type !== "selectOption")
      throw new Error(`not an option: ${id}`);

    record(id, path);
    return {
      id: option.discordId,
      label: option.label,
      description: option.description,
      emoji: option.emoji,
      action_set_id: option.action_set_id,
    };
  }

  function galleryItem(
    id: NodeId,
    path: string,
  ): MessageComponentMediaGalleryItem {
    const item = node(id);
    if (item?.type !== "mediaGalleryItem")
      throw new Error(`not a gallery item: ${id}`);

    record(id, path);
    return {
      id: item.discordId,
      media: item.media,
      description: item.description,
      spoiler: item.spoiler,
    };
  }

  function component(id: NodeId, path: string): MessageComponent {
    const componentNode = node(id);
    if (!componentNode) throw new Error(`unknown node: ${id}`);

    record(id, path);

    switch (componentNode.type) {
      case "actionRow":
        return {
          id: componentNode.discordId,
          type: 1,
          components: componentNode.childIds.map(
            (childId, i) =>
              component(childId, `${path}.components.${i}`) as
                | MessageComponentButton
                | MessageComponentSelectMenu,
          ),
        } satisfies MessageComponentActionRow;
      case "button":
        return componentNode.style === 5
          ? ({
              id: componentNode.discordId,
              type: 2,
              style: 5,
              label: componentNode.label,
              emoji: componentNode.emoji,
              url: componentNode.url ?? "",
              disabled: componentNode.disabled,
              action_set_id: componentNode.action_set_id,
            } satisfies MessageComponentButton)
          : ({
              id: componentNode.discordId,
              type: 2,
              style: componentNode.style,
              label: componentNode.label,
              emoji: componentNode.emoji,
              disabled: componentNode.disabled,
              action_set_id: componentNode.action_set_id,
            } satisfies MessageComponentButton);
      case "selectMenu":
        return {
          id: componentNode.discordId,
          type: 3,
          placeholder: componentNode.placeholder,
          disabled: componentNode.disabled,
          options: componentNode.optionIds.map((optionId, i) =>
            selectOption(optionId, `${path}.options.${i}`),
          ),
        } satisfies MessageComponentSelectMenu;
      case "section": {
        const accessory =
          componentNode.accessoryId &&
          (component(
            componentNode.accessoryId,
            `${path}.accessory`,
          ) as MessageComponentAccessory);

        // A section always carries an accessory in the schema. A missing one is
        // left out so validation reports it instead of the payload faking one.
        return {
          id: componentNode.discordId,
          type: 9,
          components: componentNode.childIds.map(
            (childId, i) =>
              component(
                childId,
                `${path}.components.${i}`,
              ) as MessageComponentTextDisplay,
          ),
          ...(accessory ? { accessory } : {}),
        } as MessageComponentSection;
      }
      case "textDisplay":
        return {
          id: componentNode.discordId,
          type: 10,
          content: componentNode.content,
        } satisfies MessageComponentTextDisplay;
      case "thumbnail":
        return {
          id: componentNode.discordId,
          type: 11,
          media: componentNode.media,
          description: componentNode.description,
          spoiler: componentNode.spoiler,
        } satisfies MessageComponentThumbnail;
      case "mediaGallery":
        return {
          id: componentNode.discordId,
          type: 12,
          items: componentNode.itemIds.map((itemId, i) =>
            galleryItem(itemId, `${path}.items.${i}`),
          ),
        } satisfies MessageComponentMediaGallery;
      case "file":
        return {
          id: componentNode.discordId,
          type: 13,
          file: componentNode.file,
          spoiler: componentNode.spoiler,
        } satisfies MessageComponentFile;
      case "separator":
        return {
          id: componentNode.discordId,
          type: 14,
          divider: componentNode.divider,
          spacing: componentNode.spacing,
        } satisfies MessageComponentSeparator;
      case "container":
        return {
          id: componentNode.discordId,
          type: 17,
          accent_color: componentNode.accent_color,
          spoiler: componentNode.spoiler,
          components: componentNode.childIds.map(
            (childId, i) =>
              component(
                childId,
                `${path}.components.${i}`,
              ) as MessageComponentContainerSubComponent,
          ),
        } satisfies MessageComponentContainer;
      default:
        throw new Error(`not a component: ${id}`);
    }
  }

  const root = state.nodes[state.rootId];
  if (root?.type !== "message") {
    throw new Error(`document root is not a message: ${state.rootId}`);
  }

  record(root.id, "");

  const message: Message = {
    content: root.content,
    username: root.username,
    avatar_url: root.avatar_url,
    tts: root.tts,
    thread_name: root.thread_name,
    flags: root.flags,
    allowed_mentions: root.allowed_mentions,
    embeds: root.embedIds.map((id, i) => embed(id, `embeds.${i}`)),
    components: root.componentIds.map((id, i) =>
      component(id, `components.${i}`),
    ),
    actions: state.actions,
  };

  const converted = { message, pathToId, idToPath };
  cache.set(state.nodes, { state, converted });
  return converted;
}

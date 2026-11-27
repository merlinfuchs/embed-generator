import { actionName } from "./actionNames";
import type { MessageAction } from "./schema";

type Path = (string | number)[];

// The message is checked before it's valid, so nothing in it can be trusted to
// have the shape of its type.
type Value = Record<string, unknown> | undefined;

const COMPONENT_NAMES: Record<number, string> = {
  1: "Action Row",
  2: "Button",
  3: "Select Menu",
  5: "User Select",
  6: "Role Select",
  7: "User & Role Select",
  8: "Channel Select",
  9: "Section",
  10: "Text Display",
  11: "Thumbnail",
  12: "Media Gallery",
  13: "File",
  14: "Separator",
  17: "Container",
};

const MESSAGE_FIELDS: Record<string, string> = {
  content: "Content",
  username: "Username",
  avatar_url: "Avatar URL",
  poll: "Poll",
  embeds: "Embeds",
  components: "Components",
  thread_name: "Thread Name",
};

const EMBED_FIELDS: Record<string, string> = {
  author: "Author",
  footer: "Footer",
  image: "Images",
  thumbnail: "Images",
};

function at(value: unknown, key: string | number): Value {
  if (typeof value !== "object" || value === null) return undefined;
  return (value as Record<string | number, unknown>)[key] as Value;
}

function quoted(name: string, label: unknown) {
  return typeof label === "string" && label ? `${name} "${label}"` : name;
}

function componentName(component: Value, index: number) {
  const name = COMPONENT_NAMES[component?.type as number] ?? "Component";
  if (component?.type === 2) return quoted(name, component.label);

  return `${name} ${index + 1}`;
}

/** Names the components along `path`, which starts at an index into `list`. */
function describeComponents(list: unknown, path: Path, parts: string[]) {
  const [index, key, ...rest] = path;
  if (typeof index !== "number") return;

  const component = at(list, index);
  parts.push(componentName(component, index));

  if (key === "components") {
    describeComponents(component?.components, rest, parts);
  } else if (key === "accessory") {
    parts.push(quoted("Accessory", at(component, "accessory")?.label));
  } else if (key === "options" && typeof rest[0] === "number") {
    parts.push(
      quoted(`Option ${rest[0] + 1}`, at(component?.options, rest[0])?.label),
    );
  } else if (key === "items" && typeof rest[0] === "number") {
    parts.push(`Item ${rest[0] + 1}`);
  }
}

/** Finds the button or select menu option that runs the action set. */
function findActionSetOwner(
  list: unknown,
  setId: string,
  parts: string[],
): boolean {
  if (!Array.isArray(list)) return false;

  for (const [index, component] of list.entries()) {
    parts.push(componentName(component, index));

    if (component?.action_set_id === setId) return true;

    if (Array.isArray(component?.options)) {
      for (const [i, option] of component.options.entries()) {
        if (option?.action_set_id === setId) {
          parts.push(quoted(`Option ${i + 1}`, option.label));
          return true;
        }
      }
    }

    if (at(component, "accessory")?.action_set_id === setId) {
      parts.push(quoted("Accessory", at(component, "accessory")?.label));
      return true;
    }

    if (findActionSetOwner(component?.components, setId, parts)) return true;

    parts.pop();
  }

  return false;
}

/**
 * Where an issue sits in the message, in the names the editor shows, like
 * `Container 1 › Action Row 3 › Button "Apply" › Show Form`. Null when the
 * path doesn't lead anywhere the editor has a name for.
 */
export function describeIssueLocation(
  message: unknown,
  path: Path,
): string | null {
  const [root, ...rest] = path;
  const parts: string[] = [];

  if (root === "components" && rest.length > 0) {
    describeComponents(at(message, "components"), rest, parts);
  } else if (root === "embeds" && typeof rest[0] === "number") {
    parts.push(`Embed ${rest[0] + 1}`);

    const [, key, fieldIndex] = rest;
    if (key === "fields" && typeof fieldIndex === "number") {
      parts.push(`Field ${fieldIndex + 1}`);
    } else if (typeof key === "string") {
      parts.push(EMBED_FIELDS[key] ?? "Body");
    }
  } else if (root === "actions" && typeof rest[0] === "string") {
    const [setId, , actionIndex] = rest;
    if (!findActionSetOwner(at(message, "components"), setId, parts)) {
      return null;
    }

    parts.push("Actions");

    const action = at(
      at(at(message, "actions"), setId)?.actions,
      actionIndex ?? -1,
    );
    if (typeof action?.type === "number") {
      const name = actionName(action as unknown as MessageAction);
      if (name) parts.push(name);
    }
  } else if (typeof root === "string" && MESSAGE_FIELDS[root]) {
    parts.push(MESSAGE_FIELDS[root]);
  }

  return parts.length > 0 ? parts.join(" › ") : null;
}

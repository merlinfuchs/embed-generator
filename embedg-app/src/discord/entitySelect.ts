import type { EntitySelectType } from "./schema";

/** What the select menus that have no options are called, as in forms. */
export const ENTITY_SELECT_NAMES: Record<EntitySelectType, string> = {
  5: "User Select",
  6: "Role Select",
  7: "User & Role Select",
  8: "Channel Select",
};

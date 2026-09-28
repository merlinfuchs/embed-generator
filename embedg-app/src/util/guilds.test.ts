import { describe, expect, it } from "vitest";
import type { GuildWire } from "../api/wire";
import { defaultGuild } from "./guilds";

function guild(id: string, canManageWebhooks: boolean): GuildWire {
  return { id, name: id, icon: null, can_manage_webhooks: canManageWebhooks };
}

describe("defaultGuild", () => {
  it("skips servers the user can't manage webhooks in", () => {
    expect(
      defaultGuild([guild("a", false), guild("b", true), guild("c", true)])?.id,
    ).toBe("b");
  });

  it("falls back to the first server", () => {
    expect(defaultGuild([guild("a", false), guild("b", false)])?.id).toBe("a");
  });

  it("returns nothing without servers", () => {
    expect(defaultGuild([])).toBeUndefined();
  });
});

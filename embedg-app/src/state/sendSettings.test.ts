import { beforeEach, expect, test } from "vitest";
import { useSendSettingsStore } from "./sendSettings";

beforeEach(() => {
  useSendSettingsStore.setState({
    guildId: "1",
    channelId: "2",
    threadName: "Patch Notes",
  });
});

test("switching servers clears the channel", () => {
  useSendSettingsStore.getState().setGuildId("3");

  const state = useSendSettingsStore.getState();
  expect(state.guildId).toBe("3");
  expect(state.channelId).toBeNull();
  expect(state.threadName).toBeNull();
});

test("selecting the same server keeps the channel", () => {
  useSendSettingsStore.getState().setGuildId("1");

  expect(useSendSettingsStore.getState().channelId).toBe("2");
});

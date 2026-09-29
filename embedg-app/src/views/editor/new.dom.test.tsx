import { screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { useSendSettingsStore } from "../../state/sendSettings";
import { defaultPlanFeatures } from "../../test/plan";
import {
  currentMessage,
  editorUser,
  loadMessage,
  renderEditor,
} from "../../test/editor";
import NewMessageView from "./new";

afterEach(() => {
  vi.unstubAllGlobals();
  useSendSettingsStore.setState({ mode: "webhook", guildId: null });
});

function logIn() {
  const responses: Record<string, unknown> = {
    "/api/users/@me": { id: "1", name: "Tester" },
    "/api/premium/features": defaultPlanFeatures,
  };
  vi.stubGlobal("fetch", async (url: string) => {
    const data = responses[url.split("?")[0]];
    return {
      json: async () =>
        data ? { success: true, data } : { success: false, error: {} },
    };
  });
  useSendSettingsStore.setState({ guildId: "123" });
}

test("a template replaces the message after confirming", async () => {
  loadMessage({ content: "Old message" });
  renderEditor(<NewMessageView />);
  const user = editorUser();

  await user.click(screen.getByRole("button", { name: /Patch notes/ }));
  await user.click(screen.getByRole("button", { name: "Use template" }));
  expect(currentMessage().content).toBe("Old message");
  await user.click(screen.getByRole("button", { name: "Confirm" }));

  expect(currentMessage()).toMatchObject({
    content: "",
    embeds: [{ title: "Update 1.2.0" }],
  });
});

test("blank starts over", async () => {
  loadMessage({ content: "Old message", embeds: [{ title: "Old embed" }] });
  renderEditor(<NewMessageView />);
  const user = editorUser();

  await user.click(screen.getByRole("button", { name: /Blank message/ }));
  await user.click(screen.getByRole("button", { name: "Confirm" }));

  expect(currentMessage()).toMatchObject({ content: "", embeds: [] });
});

test("logged out it offers the embed templates and a login", async () => {
  loadMessage({ content: "" });
  renderEditor(<NewMessageView />);
  const login = await screen.findByRole("link", { name: "Log in" });

  expect(
    screen.getByRole("button", { name: /Server rules/ }),
  ).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Server guide/ })).toBeNull();
  expect(screen.queryByRole("button", { name: /Role selection/ })).toBeNull();
  expect(screen.queryByRole("button", { name: /AI/ })).toBeNull();
  expect(login).toHaveAttribute(
    "href",
    expect.stringContaining("/api/auth/login"),
  );
});

test("logged in with a server it offers everything", async () => {
  logIn();
  loadMessage({ content: "" });
  renderEditor(<NewMessageView />);

  expect(
    await screen.findByRole("button", { name: /Server guide/ }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /Describe it to the AI/ }),
  ).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "Log in" })).toBeNull();
});

test("a template with components switches to sending through the bot", async () => {
  logIn();
  loadMessage({ content: "" });
  renderEditor(<NewMessageView />);
  const user = editorUser();

  await user.click(
    await screen.findByRole("button", { name: /Role selection/ }),
  );
  await user.click(screen.getByRole("button", { name: "Use template" }));

  expect(useSendSettingsStore.getState().mode).toBe("channel");
  expect(currentMessage().components).toHaveLength(1);
});

import { screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { COMPONENTS_V2_FLAG } from "../../discord/schema";
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

  await user.click(screen.getByRole("button", { name: "Embeds V1" }));
  await user.click(screen.getByRole("button", { name: "Use Patch notes" }));
  expect(currentMessage().content).toBe("Old message");
  await user.click(screen.getByRole("button", { name: "Confirm" }));

  expect(currentMessage()).toMatchObject({
    content: "",
    embeds: [{ image: {} }, { title: "Update 1.2.0" }],
  });
});

test("templates start as Components V2", async () => {
  loadMessage({ content: "" });
  renderEditor(<NewMessageView />);

  await editorUser().click(
    screen.getByRole("button", { name: "Use Patch notes" }),
  );

  expect(currentMessage()).toMatchObject({
    flags: COMPONENTS_V2_FLAG,
    components: [{ type: 17 }],
  });
});

test.each([
  ["Components V2", COMPONENTS_V2_FLAG],
  ["Embeds V1", 0],
])("starting from scratch as %s", async (format, flags) => {
  loadMessage({ content: "Old message", embeds: [{ title: "Old embed" }] });
  renderEditor(<NewMessageView />);
  const user = editorUser();

  await user.click(screen.getByRole("button", { name: format }));
  await user.click(screen.getByRole("button", { name: "Start from scratch" }));
  await user.click(screen.getByRole("button", { name: "Confirm" }));

  expect(currentMessage()).toMatchObject({
    content: "",
    embeds: [],
    components: [],
    flags,
  });
});

test("logged out only the templates that need the bot ask to log in", async () => {
  loadMessage({ content: "" });
  renderEditor(<NewMessageView />);
  const logins = await screen.findAllByRole("link", { name: "Log in to use" });

  expect(
    screen.getByRole("button", { name: "Use Welcome" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Use Role selection" }),
  ).toBeNull();
  expect(logins).toHaveLength(1);
  expect(logins[0]).toHaveAttribute(
    "href",
    expect.stringContaining("/api/auth/login"),
  );
  expect(screen.queryByRole("button", { name: /AI/ })).toBeNull();
});

test("logged in with a server it offers everything", async () => {
  logIn();
  loadMessage({ content: "" });
  renderEditor(<NewMessageView />);

  expect(
    await screen.findByRole("button", { name: "Use Role selection" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /Describe it to the AI/ }),
  ).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "Log in to use" })).toBeNull();
});

test("a template that needs the bot switches to sending through it", async () => {
  logIn();
  loadMessage({ content: "" });
  renderEditor(<NewMessageView />);
  const user = editorUser();

  await user.click(
    await screen.findByRole("button", { name: "Use Role selection" }),
  );
  // The roles are asked for first.
  expect(screen.getByText("Set up Role selection")).toBeInTheDocument();
  expect(screen.getByText("Role for 📣 Announcements")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Use template" }));

  expect(useSendSettingsStore.getState().mode).toBe("channel");
  expect(currentMessage().components).toHaveLength(1);
});

test("a template with only link buttons stays on the webhook", async () => {
  logIn();
  loadMessage({ content: "" });
  renderEditor(<NewMessageView />);

  const user = editorUser();

  await user.click(await screen.findByRole("button", { name: "Use Welcome" }));
  await user.click(screen.getByRole("button", { name: "Use template" }));

  expect(currentMessage().components).not.toEqual([]);
  expect(useSendSettingsStore.getState().mode).toBe("webhook");
});

test("going back from the fields keeps the message", async () => {
  logIn();
  loadMessage({ content: "" });
  renderEditor(<NewMessageView />);
  const user = editorUser();

  await user.click(await screen.findByRole("button", { name: "Use Welcome" }));
  expect(screen.getByText("Rules channel")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Back" }));

  expect(screen.getByText("New message")).toBeInTheDocument();
  expect(currentMessage().components).toEqual([]);
});

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { RoleSelect } from "./RoleSelect";

test("roles can be picked with the keyboard", () => {
  const queryClient = new QueryClient();
  queryClient.setQueryData(["guild", "1", "roles"], {
    success: true,
    data: [
      { id: "a", name: "Admin", managed: false, color: 0, position: 2 },
      { id: "m", name: "Member", managed: false, color: 0, position: 1 },
    ],
  });
  const onChange = vi.fn();
  render(
    <QueryClientProvider client={queryClient}>
      <RoleSelect guildId="1" roleId={null} onChange={onChange} />
    </QueryClientProvider>,
  );

  const trigger = screen.getByText("Select role");
  // A closed picker opens with the arrow keys.
  fireEvent.keyDown(trigger, { key: "ArrowDown" });
  expect(screen.getByText("Admin")).toBeInTheDocument();

  fireEvent.keyDown(trigger, { key: "ArrowDown" });
  fireEvent.keyDown(trigger, { key: "Enter" });

  expect(onChange).toHaveBeenCalledWith("m");
  expect(screen.queryByText("Admin")).not.toBeInTheDocument();
});

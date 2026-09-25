import { render, screen } from "@testing-library/react";
import { useState } from "react";
import { expect, test, vi } from "vitest";
import { editorUser } from "../test/editor";
import ColorPicker from "./ColorPicker";

const onChange = vi.fn();

function Harness() {
  const [value, setValue] = useState<number | undefined>(0xff0000);
  return (
    <>
      <ColorPicker
        value={value}
        onChange={(v) => {
          onChange(v);
          setValue(v);
        }}
      />
      <button onClick={() => setValue(0x00ff00)}>Elsewhere</button>
    </>
  );
}

function setup() {
  onChange.mockClear();
  render(<Harness />);
  return {
    user: editorUser(),
    input: screen.getByRole("textbox", { name: "Hex color" }),
  };
}

test("a half typed color stays as typed", async () => {
  const { user, input } = setup();

  await user.clear(input);
  onChange.mockClear();
  await user.type(input, "0a1");

  expect(input).toHaveValue("0a1");
  expect(onChange).not.toHaveBeenCalled();
});

test("a complete color is committed", async () => {
  const { user, input } = setup();

  await user.clear(input);
  await user.type(input, "#0000FF");

  expect(onChange).toHaveBeenLastCalledWith(0x0000ff);
  expect(input).toHaveValue("#0000FF");
});

test("clearing the text clears the color", async () => {
  const { user, input } = setup();

  await user.clear(input);

  expect(onChange).toHaveBeenLastCalledWith(undefined);
});

test("the text follows a change from elsewhere", async () => {
  const { user, input } = setup();

  await user.click(screen.getByRole("button", { name: "Elsewhere" }));

  expect(input).toHaveValue("00ff00");
});

test("leaving a half typed color puts the current one back", async () => {
  const { user, input } = setup();

  await user.type(input, "zz");
  expect(input).toHaveValue("ff0000zz");
  await user.tab();

  expect(input).toHaveValue("ff0000");
  expect(onChange).not.toHaveBeenCalled();
});

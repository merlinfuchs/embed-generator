import { render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import SelectDropdown from "./SelectDropdown";

// jsdom doesn't lay anything out, so the trigger position is faked.
function renderAt(top: number, height = 40) {
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
    top,
    bottom: top + height,
    height,
    left: 0,
    right: 200,
    width: 200,
    x: 0,
    y: top,
    toJSON: () => ({}),
  });

  render(
    <div className="relative">
      <SelectDropdown>
        <div>An option</div>
      </SelectDropdown>
    </div>,
  );

  const dropdown = screen.getByText("An option").parentElement!;
  return dropdown;
}

afterEach(() => vi.restoreAllMocks());

test("opens below the trigger when there is room", () => {
  window.innerHeight = 800;

  const dropdown = renderAt(100);

  expect(dropdown.className).toContain("top-full");
  expect(dropdown.style.maxHeight).toBe("192px");
});

test("opens above the trigger when it would be cut off below", () => {
  window.innerHeight = 800;

  const dropdown = renderAt(740);

  expect(dropdown.className).toContain("bottom-full");
  expect(dropdown.style.maxHeight).toBe("192px");
});

test("shrinks to the space that is left", () => {
  window.innerHeight = 300;

  const dropdown = renderAt(120);

  expect(dropdown.className).toContain("top-full");
  // 300 - 160 - 16
  expect(dropdown.style.maxHeight).toBe("124px");
});

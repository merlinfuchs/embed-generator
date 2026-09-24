import { render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import SelectDropdown from "./SelectDropdown";

// jsdom doesn't lay anything out, so the trigger position is faked.
function renderAt(viewportHeight: number, top: number) {
  window.innerHeight = viewportHeight;
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
    top,
    bottom: top + 40,
  } as DOMRect);

  render(
    <div className="relative">
      <SelectDropdown>
        <div>An option</div>
      </SelectDropdown>
    </div>,
  );

  return screen.getByText("An option").parentElement!;
}

afterEach(() => vi.restoreAllMocks());

test("opens below the trigger when there is room", () => {
  const dropdown = renderAt(800, 100);

  expect(dropdown.className).toContain("top-full");
  expect(dropdown.style.maxHeight).toBe("192px");
});

test("opens above the trigger when it would be cut off below", () => {
  const dropdown = renderAt(800, 740);

  expect(dropdown.className).toContain("bottom-full");
});

test("shrinks to the space that is left", () => {
  const dropdown = renderAt(300, 120);

  expect(dropdown.className).toContain("top-full");
  // 300 - 160 - 16
  expect(dropdown.style.maxHeight).toBe("124px");
});

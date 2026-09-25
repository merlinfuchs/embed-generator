import { useEffect, useMemo, useState } from "react";
import { HexColorPicker } from "react-colorful";
import ClickOutsideHandler from "./ClickOutsideHandler";

interface Props {
  value: number | undefined;
  onChange: (newValue: number | undefined) => void;
}

/** undefined clears the color, null means the text isn't a color (yet). */
function parseHexColor(text: string): number | undefined | null {
  const raw = text.trim().replace(/^#/, "");
  if (!raw) return undefined;
  if (!/^[0-9a-f]{6}$/i.test(raw)) return null;
  return parseInt(raw, 16);
}

export default function ColorPicker({ value, onChange }: Props) {
  const [show, setShow] = useState(false);

  const hexColor = useMemo(() => {
    if (value || value === 0) {
      return value.toString(16).padStart(6, "0");
    } else {
      return "";
    }
  }, [value]);

  // The text input edits a draft so that a half typed color isn't replaced
  // with the value it happens to parse to.
  const [draft, setDraft] = useState(hexColor);

  useEffect(() => {
    if (parseHexColor(draft) !== value) setDraft(hexColor);
  }, [value]);

  function setDraftColor(text: string) {
    setDraft(text);
    const color = parseHexColor(text);
    if (color !== null && color !== value) onChange(color);
  }

  const displayColor = hexColor ? `#${hexColor}` : "#1f2225";

  return (
    <div className="flex space-x-2">
      <div className="flex">
        <div className="bg-ink-900 rounded-l-lg flex items-center px-2 text-mist-300">
          #
        </div>
        <input
          type="text"
          aria-label="Hex color"
          className="bg-ink-900 rounded-r-lg p-2 w-full font-light text-white focus:outline-none"
          value={draft}
          onChange={(e) => setDraftColor(e.target.value)}
          onBlur={() => setDraft(hexColor)}
          placeholder="rrggbb"
        />
      </div>
      <ClickOutsideHandler
        onClickOutside={() => setShow(false)}
        className="relative"
      >
        <button
          type="button"
          aria-label="Pick a color"
          className="w-12 h-full rounded-lg cursor-pointer relative bg-ink-600"
          style={{ backgroundColor: displayColor }}
          onClick={() => setShow(!show)}
        />
        {show && (
          <div className="absolute bottom-14 right-0">
            <HexColorPicker
              color={`#${hexColor}`}
              onChange={(color) => setDraftColor(color.slice(1))}
            />
          </div>
        )}
      </ClickOutsideHandler>
    </div>
  );
}

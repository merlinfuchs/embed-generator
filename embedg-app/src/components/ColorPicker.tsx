import { useMemo, useState } from "react";
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

  // What is typed while the input has focus, so that a half typed color isn't
  // replaced with the value it happens to parse to. null shows the value.
  const [draft, setDraft] = useState<string | null>(null);

  function setColor(text: string) {
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
          value={draft ?? hexColor}
          onChange={(e) => {
            setDraft(e.target.value);
            setColor(e.target.value);
          }}
          onBlur={() => setDraft(null)}
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
              onChange={(color) => setColor(color)}
            />
          </div>
        )}
      </ClickOutsideHandler>
    </div>
  );
}

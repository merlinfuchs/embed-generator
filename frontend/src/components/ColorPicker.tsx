import { useEffect, useMemo, useState } from "react";
import { HexColorPicker } from "react-colorful";
import ClickOutsideHandler from "./ClickOutsideHandler";

interface Props {
  value: number | undefined;
  onChange: (newValue: number | undefined) => void;
}

export default function ColorPicker({ value, onChange }: Props) {
  const [show, setShow] = useState(false);

  const [hexColor, setHexColor] = useState("");

  useEffect(() => {
    const raw = hexColor.trim();
    if (raw) {
      const value = parseInt(raw.substring(1), 16);
      if (value || value === 0) {
        onChange(value);
      } else {
        onChange(undefined);
      }
    } else {
      onChange(undefined);
    }
  }, [hexColor]);

  useEffect(() => {
    if (value || value === 0) {
      setHexColor("#" + value.toString(16));
    }
  }, [value]);

  return (
    <div className="flex space-x-2">
      <div className="flex">
        <div className="bg-dark-1 rounded-l flex items-center px-2 text-gray-300">
          #
        </div>
        <input
          type="text"
          className="bg-dark-2 rounded-r p-2 w-full no-ring font-light"
          value={hexColor}
          onChange={(e) => setHexColor(e.target.value)}
          placeholder="#rrggbb"
        />
      </div>
      <ClickOutsideHandler
        onClickOutside={() => setShow(false)}
        className="relative"
      >
        <div
          className="w-12 h-full rounded cursor-pointer relative bg-dark-5"
          style={{ backgroundColor: hexColor }}
          role="button"
          onClick={() => setShow(!show)}
        />
        {show && (
          <div className="absolute bottom-14 right-0">
            <HexColorPicker color={hexColor} onChange={setHexColor} />
          </div>
        )}
      </ClickOutsideHandler>
    </div>
  );
}

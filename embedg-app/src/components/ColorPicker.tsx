import { useMemo, useState } from "react";
import { HexColorPicker } from "react-colorful";
import ClickOutsideHandler from "./ClickOutsideHandler";

interface Props {
  value: number | undefined;
  onChange: (newValue: number | undefined) => void;
}

export default function ColorPicker({ value, onChange }: Props) {
  const [show, setShow] = useState(false);

  function setHexColor(newColor: string) {
    let raw = newColor.trim();
    while (raw.startsWith("#")) {
      raw = raw.substring(1);
    }

    if (raw) {
      const value = parseInt(raw, 16);
      if (!isNaN(value)) {
        onChange(value);
      } else {
        onChange(undefined);
      }
    } else {
      onChange(undefined);
    }
  }

  const hexColor = useMemo(() => {
    if (value || value === 0) {
      return value.toString(16).padStart(6, "0");
    } else {
      return "";
    }
  }, [value]);

  const displayColor = hexColor ? "#" + hexColor : "#1f2225";

  return (
    <div className="flex space-x-2">
      <div className="flex">
        <div className="bg-dark-1 rounded-l flex items-center px-2 text-gray-300">
          #
        </div>
        <input
          type="text"
          className="bg-dark-2 rounded-r p-2 w-full no-ring font-light text-white focus:outline-none"
          value={hexColor}
          onChange={(e) => setHexColor(e.target.value)}
          placeholder="rrggbb"
        />
      </div>
      <ClickOutsideHandler
        onClickOutside={() => setShow(false)}
        className="relative"
      >
        <div
          className="w-12 h-full rounded cursor-pointer relative bg-dark-5"
          style={{ backgroundColor: displayColor }}
          role="button"
          onClick={() => setShow(!show)}
        />
        {show && (
          <div className="absolute bottom-14 right-0">
            <HexColorPicker color={"#" + hexColor} onChange={setHexColor} />
          </div>
        )}
      </ClickOutsideHandler>
    </div>
  );
}

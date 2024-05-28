import { useMemo } from "react";
import { HexColorPicker } from "react-colorful";
import { Popover, PopoverTrigger } from "./ui/popover";
import { Input } from "./ui/input";
import { PopoverContent } from "@radix-ui/react-popover";

interface Props {
  value: number | undefined;
  onChange: (newValue: number | undefined) => void;
}

export default function ColorPicker({ value, onChange }: Props) {
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
      <div className="flex flex-auto">
        <div className="border rounded-l flex items-center px-2 text-gray-300 select-none">
          #
        </div>
        <Input
          type="text"
          value={hexColor}
          onChange={(e) => setHexColor(e.target.value)}
          placeholder="rrggbb"
          className="rounded-l-none border-l-0"
        />
      </div>
      <Popover>
        <PopoverTrigger>
          <div
            className="w-12 h-full rounded cursor-pointer relative border"
            style={{ backgroundColor: displayColor }}
            role="button"
          />
        </PopoverTrigger>
        <PopoverContent>
          <HexColorPicker color={"#" + hexColor} onChange={setHexColor} />
        </PopoverContent>
      </Popover>
    </div>
  );
}

import ReactDateTimePicker from "react-datetime-picker";

import "react-datetime-picker/dist/DateTimePicker.css";
import "react-calendar/dist/Calendar.css";
import "react-clock/dist/Clock.css";
import "./DateTimePicker.css";

interface Props {
  value: string | undefined;
  onChange: (v: string | undefined) => void;
}

// In the browser's local time.
export default function DateTimePicker({ value, onChange }: Props) {
  return (
    <ReactDateTimePicker
      onChange={(v) =>
        onChange(v instanceof Date ? v.toISOString() : undefined)
      }
      value={value ? new Date(value) : null}
    />
  );
}

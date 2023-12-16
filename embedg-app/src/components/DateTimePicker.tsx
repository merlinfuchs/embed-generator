import ReactDateTimePicker from "react-datetime-picker";

import "react-datetime-picker/dist/DateTimePicker.css";
import "react-calendar/dist/Calendar.css";
import "react-clock/dist/Clock.css";
import "./DateTimePicker.css";

interface Props {
  value: string | undefined;
  onChange: (v: string | undefined) => void;
  clearable: boolean;
}

export default function DateTimePicker({ value, onChange, clearable }: Props) {
  return (
    <ReactDateTimePicker
      onChange={(v) => onChange(v?.toISOString())}
      value={value}
      clearIcon={clearable ? undefined : null}
    />
  );
}

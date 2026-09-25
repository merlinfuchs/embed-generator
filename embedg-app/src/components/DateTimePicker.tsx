import { useMemo } from "react";
import ReactDateTimePicker from "react-datetime-picker";
import { fromZonedDate, toZonedDate } from "../util/time";

import "react-datetime-picker/dist/DateTimePicker.css";
import "react-calendar/dist/Calendar.css";
import "react-clock/dist/Clock.css";
import "./DateTimePicker.css";

interface Props {
  value: string | undefined;
  onChange: (v: string | undefined) => void;
  clearable: boolean;
  // Local time when not set.
  timezone?: string;
}

export default function DateTimePicker({
  value,
  onChange,
  clearable,
  timezone,
}: Props) {
  const date = useMemo(
    () =>
      !value ? null : timezone ? toZonedDate(value, timezone) : new Date(value),
    [value, timezone],
  );

  return (
    <ReactDateTimePicker
      onChange={(v) => {
        if (!(v instanceof Date)) onChange(undefined);
        else onChange(timezone ? fromZonedDate(v, timezone) : v.toISOString());
      }}
      value={date}
      clearIcon={clearable ? undefined : null}
    />
  );
}

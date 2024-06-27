import ColorPicker from "./ColorPicker";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Switch } from "../ui/switch";
import { Textarea } from "../ui/textarea";
import { DatePicker } from "./DatePicker";
import { CircleAlertIcon } from "lucide-react";

export type BaseInputProps = {
  label: string;
  description?: string;
  error?: string;
} & (
  | {
      type: "text" | "url" | "email" | "textarea";
      value: string;
      onChange: (value: string) => void;
      maxLength?: number;
      placeholder?: string;
    }
  | {
      type: "select";
      value: string;
      options: { label: string; value: string }[];
      onChange: (value: string) => void;
      placeholder: string;
    }
  | {
      type: "toggle";
      value: boolean;
      onChange: (value: boolean) => void;
    }
  | {
      type: "color";
      value: number | undefined;
      onChange: (value: number | undefined) => void;
    }
  | {
      type: "date";
      value: string | undefined;
      onChange: (value: string | undefined) => void;
    }
);

export default function BaseInput(props: BaseInputProps) {
  const { label, error, type, value, onChange } = props;

  const isText =
    type === "text" ||
    type === "url" ||
    type === "email" ||
    type === "textarea";

  return (
    <div className="space-y-1 w-full">
      <div className="flex space-x-2 mb-2 items-center">
        <Label className="text-base text-slate-800 dark:text-slate-200">
          {label}
        </Label>
        {isText && props.maxLength && (
          <div className="text-sm italic font-light text-muted-foreground">
            {value.length} / {props.maxLength}
          </div>
        )}
      </div>
      <div>
        {type === "text" || type === "url" || type === "email" ? (
          <Input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            maxLength={props.maxLength}
            placeholder={props.placeholder}
          />
        ) : type === "textarea" ? (
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            minRows={3}
            maxRows={15}
          />
        ) : type === "select" ? (
          <Select>
            <SelectTrigger>
              <SelectValue placeholder={props.placeholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Fruits</SelectLabel>
                {props.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        ) : type === "toggle" ? (
          <Switch checked={value} onCheckedChange={onChange} />
        ) : type === "color" ? (
          <ColorPicker value={value} onChange={onChange} />
        ) : type === "date" ? (
          <DatePicker value={value} onChange={onChange} />
        ) : null}
      </div>
      {error && (
        <div className="text-red-600 dark:text-red-400 text-sm flex items-center space-x-1 pt-1">
          <CircleAlertIcon className="h-5 w-5 flex-none" />
          <div>{error}</div>
        </div>
      )}
    </div>
  );
}

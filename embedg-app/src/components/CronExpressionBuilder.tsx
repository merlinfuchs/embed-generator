import EditorInput from "./EditorInput";
import cronstrue from "cronstrue";

interface Props {
  value: string | null;
  onChange: (v: string | null) => void;
}

export default function CronExpressionBuilder({ value, onChange }: Props) {
  return (
    <div>
      <EditorInput
        label="CRON Expression"
        type="text"
        value={value || ""}
        onChange={(v) => onChange(v || null)}
      />
      <div className="text-gray-400 text-sm mt-1">{cronToString(value)}</div>
    </div>
  );
}

function cronToString(v: string | null): string {
  if (!v) return "";
  try {
    return cronstrue.toString(v, { verbose: true });
  } catch {
    return "";
  }
}

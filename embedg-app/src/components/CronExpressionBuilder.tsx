import Cron from "react-cron-generator";
import "./CronExpressionBuilder.css";
import { useMemo } from "react";

interface Props {
  value: string | null;
  onChange: (v: string | null) => void;
}

export default function CronExpressionBuilder({ value, onChange }: Props) {
  const sevenFieldExpression = useMemo(
    () => (value ? "* " + value + " *" : undefined),
    [value]
  );

  const setSevenFieldExpression = (v: string | null) => {
    if (!v) {
      onChange(null);
      return;
    }

    const parts = v.split(" ");
    if (parts.length === 7) {
      onChange(parts.slice(2, 6).join(" "));
    }

    onChange(parts.slice(1, 6).join(" "));
  };

  return (
    <div>
      <div className="mb-3 flex">
        <div className="uppercase text-gray-300 text-sm font-medium">
          Schedule
        </div>
      </div>
      <Cron
        onChange={(v) => setSevenFieldExpression(v || null)}
        value={sevenFieldExpression}
        showResultText={true}
        showResultCron={true}
      />
    </div>
  );
}

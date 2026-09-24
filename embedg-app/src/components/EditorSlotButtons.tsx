import clsx from "clsx";

interface Props {
  addLabel: string;
  clearLabel: string;
  canAdd: boolean;
  onAdd: () => void;
  onClear: () => void;
}

/** The "Add X" / "Clear Xs" pair under every list of child components. */
export default function EditorSlotButtons({
  addLabel,
  clearLabel,
  canAdd,
  onAdd,
  onClear,
}: Props) {
  return (
    <div className="space-x-3 mt-3">
      <button
        type="button"
        disabled={!canAdd}
        className={clsx(
          "px-3 py-2 rounded-lg transition-colors",
          canAdd
            ? "bg-azure-500 hover:bg-azure-400 text-white"
            : "bg-ink-900 cursor-not-allowed text-mist-300",
        )}
        onClick={() => canAdd && onAdd()}
      >
        {addLabel}
      </button>
      <button
        type="button"
        className="px-3 py-2 rounded-lg border-2 border-red/70 hover:bg-red hover:border-red transition-colors text-white"
        onClick={onClear}
      >
        {clearLabel}
      </button>
    </div>
  );
}

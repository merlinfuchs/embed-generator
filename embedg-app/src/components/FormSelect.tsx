import { ChevronDownIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
import { useFormsQuery } from "../api/queries";
import ClickOutsideHandler from "./ClickOutsideHandler";
import SelectDropdown from "./SelectDropdown";

interface Props {
  guildId: string | null;
  formId: string | null;
  onChange: (formId: string | null) => void;
}

export default function FormSelect({ guildId, formId, onChange }: Props) {
  const { data: forms, isPending } = useFormsQuery(guildId);

  const form = useMemo(
    () => forms?.success && forms.data.find((f) => f.id === formId),
    [forms, formId],
  );

  useEffect(() => {
    if (!isPending) {
      if (!forms?.success || !forms.data.find((f) => f.id === formId)) {
        onChange(null);
      }
    }
  }, [forms, formId, isPending]);

  function selectForm(formId: string) {
    onChange(formId);
    setOpen(false);
  }

  const [open, setOpen] = useState(false);

  return (
    <ClickOutsideHandler onClickOutside={() => setOpen(false)}>
      <div className="px-3 rounded-lg bg-ink-900 relative flex items-center h-10 select-none">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="flex-auto text-left"
        >
          {!guildId ? (
            <div className="text-mist-300">Select server at the top</div>
          ) : form ? (
            <div className="flex items-center space-x-2 cursor-pointer w-full">
              <div></div>
              <div className="text-lg text-mist-300 flex-auto truncate">
                {form.name}
              </div>
              <ChevronDownIcon
                className={clsx(
                  "text-white w-5 h-5 flex-none transition-transform",
                  open && "rotate-180",
                )}
              />
            </div>
          ) : (
            <div className="text-mist-300">Select form</div>
          )}
        </button>
        {open && (
          <SelectDropdown>
            {forms?.success && forms.data.length > 0 ? (
              forms.data.map((f) => (
                <button
                  type="button"
                  key={f.id}
                  className="py-2 flex space-x-2 items-center hover:bg-ink-700 rounded-lg cursor-pointer px-3 w-full text-left"
                  onClick={() => selectForm(f.id)}
                >
                  <div></div>
                  <div className="text-mist-300">{f.name}</div>
                </button>
              ))
            ) : (
              <div className="text-mist-300 p-2">
                No forms yet, create one on the Forms page
              </div>
            )}
          </SelectDropdown>
        )}
      </div>
    </ClickOutsideHandler>
  );
}

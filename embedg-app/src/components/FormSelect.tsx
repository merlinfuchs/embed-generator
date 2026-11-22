import { useFormsQuery } from "../api/queries";
import NamedItemSelect from "./NamedItemSelect";

interface Props {
  guildId: string | null;
  formId: string | null;
  onChange: (formId: string | null) => void;
}

export default function FormSelect({ guildId, formId, onChange }: Props) {
  const { data, isPending } = useFormsQuery(guildId);

  return (
    <NamedItemSelect
      guildId={guildId}
      items={isPending ? undefined : data?.success ? data.data : []}
      value={formId}
      onChange={onChange}
      placeholder="Select form"
      emptyText="No forms yet, create one on the Forms page"
    />
  );
}

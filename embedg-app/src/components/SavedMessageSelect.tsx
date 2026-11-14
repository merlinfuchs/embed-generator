import { useSavedMessagesQuery } from "../api/queries";
import NamedItemSelect from "./NamedItemSelect";

interface Props {
  guildId: string | null;
  messageId: string | null;
  onChange: (messageId: string | null) => void;
}

export default function SavedMessageSelect({
  guildId,
  messageId,
  onChange,
}: Props) {
  const { data, isPending } = useSavedMessagesQuery(guildId);

  return (
    <NamedItemSelect
      guildId={guildId}
      items={isPending ? undefined : data?.success ? data.data : []}
      value={messageId}
      onChange={onChange}
      placeholder="Select saved message"
      emptyText="No saved messages"
    />
  );
}

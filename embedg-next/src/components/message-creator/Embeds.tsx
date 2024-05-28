import { useCurrentMessageStore } from "@/lib/state/message";
import CollapsibleSection from "./CollapsibleSection";
import Embed from "./Embed";
import { useShallow } from "zustand/react/shallow";
import { getUniqueId } from "@/lib/utils";
import { Button } from "../ui/button";

export default function Embeds() {
  const embeds = useCurrentMessageStore(
    useShallow((state) => state.embeds.map((e) => e.id))
  );
  const addEmbed = useCurrentMessageStore((state) => state.addEmbed);
  const clearEmbeds = useCurrentMessageStore((state) => state.clearEmbeds);

  return (
    <CollapsibleSection
      title="Embeds"
      valiationPathPrefix="embeds"
      className="space-y-4"
    >
      {embeds.map((id, i) => (
        <Embed key={id} embedIndex={i} embedId={id} />
      ))}
      <div className="space-x-3">
        <Button
          onClick={() =>
            addEmbed({
              id: getUniqueId(),
              description: "",
              fields: [],
            })
          }
        >
          Add Embed
        </Button>
        <Button onClick={clearEmbeds} variant="destructive">
          Clear Embeds
        </Button>
      </div>
    </CollapsibleSection>
  );
}

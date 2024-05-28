import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import CollapsibleSection from "./CollapsibleSection";
import { useCurrentMessageStore } from "@/lib/state/message";
import { useShallow } from "zustand/react/shallow";
import MessageInput from "./MessageInput";
import { useMemo } from "react";
import { colorIntToHex } from "@/lib/utils/color";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  CopyIcon,
  TrashIcon,
} from "lucide-react";
import EmbedBody from "./EmbedBody";
import EmbedAuthor from "./EmbedAuthor";
import EmbedFooter from "./EmbedFooter";
import EmbedImages from "./EmbedImages";
import EmbedFields from "./EmbedFields";

export default function Embed({
  embedId,
  embedIndex,
}: {
  embedId: number;
  embedIndex: number;
}) {
  const embedName = useCurrentMessageStore((state) => {
    const embed = state.embeds[embedIndex];
    return embed.author?.name || embed.title;
  });
  const embedCount = useCurrentMessageStore((state) => state.embeds.length);

  const [moveUp, moveDown, duplicate, remove] = useCurrentMessageStore(
    useShallow((state) => [
      state.moveEmbedUp,
      state.moveEmbedDown,
      state.duplicateEmbed,
      state.deleteEmbed,
    ])
  );

  const color = useCurrentMessageStore(
    (state) => state.embeds[embedIndex]?.color
  );

  const colorHex = useMemo(
    () => (color !== undefined ? colorIntToHex(color) : "#1f2225"),
    [color]
  );

  return (
    <Card
      className="px-4 py-3 border-l-4 rounded-l-sm"
      style={{
        borderLeftColor: colorHex,
      }}
    >
      <CollapsibleSection
        title={`Embed ${embedIndex + 1}`}
        size="lg"
        valiationPathPrefix={`embeds.${embedIndex}`}
        actions={
          <>
            {embedIndex > 0 && (
              <ChevronUpIcon
                className="h-6 w-6"
                onClick={() => moveUp(embedIndex)}
                role="button"
              />
            )}
            {embedIndex < embedCount - 1 && (
              <ChevronDownIcon
                className="h-6 w-6"
                onClick={() => moveDown(embedIndex)}
                role="button"
              />
            )}
            {embedCount < 10 && (
              <CopyIcon
                className="h-5 w-5"
                onClick={() => duplicate(embedIndex)}
                role="button"
              />
            )}
            <TrashIcon
              className="h-5 w-5"
              onClick={() => remove(embedIndex)}
              role="button"
            />
          </>
        }
        className="space-y-5"
      >
        <EmbedAuthor embedIndex={embedIndex} embedId={embedId} />
        <EmbedBody embedIndex={embedIndex} embedId={embedId} />
        <EmbedImages embedIndex={embedIndex} embedId={embedId} />
        <EmbedFooter embedIndex={embedIndex} embedId={embedId} />
        <EmbedFields embedIndex={embedIndex} embedId={embedId} />
      </CollapsibleSection>
    </Card>
  );
}

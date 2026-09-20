import clsx from "clsx";
import { type NodeId, useNode } from "../state/document";
import EditorComponentBaseActionRow from "./EditorComponentBaseActionRow";
import EditorComponentBaseContainer from "./EditorComponentBaseContainer";
import EditorComponentBaseFile from "./EditorComponentBaseFile";
import EditorComponentBaseMediaGallery from "./EditorComponentBaseMediaGallery";
import EditorComponentBaseSection from "./EditorComponentBaseSection";
import EditorComponentBaseSeparator from "./EditorComponentBaseSeparator";
import EditorComponentBaseTextDisplay from "./EditorComponentBaseTextDisplay";

interface Props {
  id: NodeId;
  /** Top level components carry their own card styling. */
  root?: boolean;
}

const PADDED = "bg-dark-3 p-3 rounded-md";
const CARD = "bg-dark-3 px-3 md:px-4 py-3 mb-3 rounded-md shadow";

/** The editor for each component type, and its card styling at the top level. */
const EDITORS = {
  actionRow: [EditorComponentBaseActionRow, PADDED],
  section: [EditorComponentBaseSection, PADDED],
  mediaGallery: [EditorComponentBaseMediaGallery, PADDED],
  textDisplay: [EditorComponentBaseTextDisplay, CARD],
  separator: [EditorComponentBaseSeparator, CARD],
  file: [EditorComponentBaseFile, CARD],
  // A container brings its own card, accent bar included.
  container: [EditorComponentBaseContainer, null],
} as const;

export default function EditorComponentEntry({ id, root }: Props) {
  const node = useNode(id);
  const editor = node && EDITORS[node.type as keyof typeof EDITORS];

  if (!node) return null;
  if (!editor) return <div>Unknown component type: {node.type}</div>;

  const [Editor, cardClassName] = editor;

  return (
    <div className={clsx(root && cardClassName)}>
      <Editor id={id} />
    </div>
  );
}

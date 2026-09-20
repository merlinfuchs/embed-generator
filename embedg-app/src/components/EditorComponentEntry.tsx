import { CARD, PADDED } from "./editorCard";
import clsx from "clsx";
import { type NodeId, useNode } from "../state/document";
import EditorComponentActionRow from "./EditorComponentActionRow";
import EditorComponentButton from "./EditorComponentButton";
import EditorComponentContainer from "./EditorComponentContainer";
import EditorComponentFile from "./EditorComponentFile";
import EditorComponentMediaGallery from "./EditorComponentMediaGallery";
import EditorComponentSection from "./EditorComponentSection";
import EditorComponentSelectMenu from "./EditorComponentSelectMenu";
import EditorComponentSeparator from "./EditorComponentSeparator";
import EditorComponentTextDisplay from "./EditorComponentTextDisplay";
import EditorComponentThumbnail from "./EditorComponentThumbnail";

interface Props {
  id: NodeId;
  /** Top level components carry their own card styling. */
  root?: boolean;
  title?: string;
}

/** The editor for each component type, and its card styling at the top level. */
const EDITORS = {
  actionRow: [EditorComponentActionRow, PADDED],
  section: [EditorComponentSection, PADDED],
  mediaGallery: [EditorComponentMediaGallery, PADDED],
  textDisplay: [EditorComponentTextDisplay, CARD],
  separator: [EditorComponentSeparator, CARD],
  file: [EditorComponentFile, CARD],
  // A container brings its own card, accent bar included.
  container: [EditorComponentContainer, null],
  // Only ever nested, so they have no top level styling of their own.
  button: [EditorComponentButton, null],
  selectMenu: [EditorComponentSelectMenu, null],
  thumbnail: [EditorComponentThumbnail, null],
} as const;

export default function EditorComponentEntry({ id, root, title }: Props) {
  const node = useNode(id);
  const editor = node && EDITORS[node.type as keyof typeof EDITORS];

  if (!node) return null;
  if (!editor) return <div>Unknown component type: {node.type}</div>;

  const [Editor, cardClassName] = editor;

  return (
    <div className={clsx(root && cardClassName)}>
      <Editor id={id} title={title} />
    </div>
  );
}

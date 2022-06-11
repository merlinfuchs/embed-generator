import { createContext, ReactNode, useContext, useReducer } from "react";
import { AttachmentWire } from "../api/wire";

export interface Attachment extends AttachmentWire {
  id?: number;
  size: number;
}

export type AttachmentsAction =
  | {
      type: "addAttachment";
      value: Attachment;
    }
  | {
      type: "removeAttachment";
      index: number;
    }
  | {
      type: "setAttachmentDescription";
      index: number;
      value: string | null;
    };

// this more-or-less makes sure that we never generate the same id twice
let lastUniqueId = Date.now();

function reducer(
  attachments: Attachment[],
  action: AttachmentsAction
): Attachment[] {
  switch (action.type) {
    case "addAttachment": {
      return [...attachments, { ...action.value, id: lastUniqueId++ }];
    }
    case "removeAttachment": {
      const newAttachments = [...attachments];
      newAttachments.splice(action.index, 1);
      return newAttachments;
    }
    case "setAttachmentDescription": {
      const newAttachments = [...attachments];
      newAttachments[action.index] = {
        ...attachments[action.index],
        description: action.value,
      };
      return newAttachments;
    }
    default: {
      ((t: never) => {})(action);
      return attachments;
    }
  }
}

const AttachmentsContext = createContext<
  [Attachment[], (action: AttachmentsAction) => void]
>([[], () => {}]);

export const AttachmentsProvider = ({ children }: { children: ReactNode }) => {
  const [msg, dispatch] = useReducer(reducer, []);

  return (
    <AttachmentsContext.Provider value={[msg, dispatch]}>
      {children}
    </AttachmentsContext.Provider>
  );
};

export default function useAttachments(): [
  Attachment[],
  (action: AttachmentsAction) => void
] {
  return useContext(AttachmentsContext);
}

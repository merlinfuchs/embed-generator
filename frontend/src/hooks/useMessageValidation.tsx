import {
  createContext,
  ReactNode,
  useContext,
  useDeferredValue,
  useMemo,
} from "react";
import { ZodFormattedError } from "zod";
import { Message, messageValidator } from "../discord/types";
import useMessage from "./useMessage";

const MessageValidationContext =
  createContext<ZodFormattedError<Message> | null>(null);

export const MessageValidationProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [msg] = useMessage();
  const defferedMsg = useDeferredValue(msg);

  const errors = useMemo(() => {
    const res = messageValidator.safeParse(defferedMsg);
    if (res.success) {
      return null;
    } else {
      return res.error.format();
    }
  }, [defferedMsg]);

  return (
    <MessageValidationContext.Provider value={errors}>
      {children}
    </MessageValidationContext.Provider>
  );
};

export default function useMessageValidation(): ZodFormattedError<Message> | null {
  return useContext(MessageValidationContext);
}

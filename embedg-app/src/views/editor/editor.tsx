import { Outlet } from "react-router-dom";
import EditorMessageContentFields from "../../components/EditorMessageContentFields";
import EditorEmbeds from "../../components/EditorEmbeds";
import EditorMenuBar from "../../components/EditorMenuBar";
import EditorMessagePreview from "../../components/EditorMessagePreview";
import EditorComponents from "../../components/EditorComponents";
import { useCurrentMessageStore } from "../../state/message";
import { debounce } from "debounce";
import { Message, messageSchema } from "../../discord/schema";
import { useValidationErrorStore } from "../../state/validationError";
import EditorAttachments from "../../components/EditorAttachments";
import SendMenu from "../../components/SendMenu";
import EditorSideNav from "../../components/EditorSideNav";

export default function EditorView() {
  const setValidationError = useValidationErrorStore((state) => state.setError);

  const debouncedSetValidationError = debounce((msg: Message) => {
    const res = messageSchema.safeParse(msg);
    setValidationError(res.success ? null : res.error);
  }, 250);

  useCurrentMessageStore((state) => {
    debouncedSetValidationError(state);
    return null;
  });

  return (
    <div className="flex h-full w-full">
      <EditorSideNav />
      <div className="flex flex-col lg:flex-row h-full flex-auto">
        <div className="lg:w-1/2 lg:h-full bg-dark-4 lg:overflow-y-auto no-scrollbar">
          <div className="p-5 space-y-5">
            <SendMenu />
            <div className="border border-dark-6"></div>
            <EditorMenuBar />
            <EditorMessageContentFields />
            <EditorAttachments />
            <EditorEmbeds />
            <EditorComponents />
          </div>
        </div>
        <div className="lg:w-1/2 lg:h-full bg-dark-4 border-t-2 lg:border-t-0 lg:border-l-2 border-dark-3 px-5 py-2 lg:overflow-y-auto no-scrollbar">
          <EditorMessagePreview />
        </div>
      </div>
      <Outlet />
    </div>
  );
}

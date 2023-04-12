import {
  TrashIcon,
  CodeBracketSquareIcon,
  SparklesIcon,
  RectangleStackIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/20/solid";
import clsx from "clsx";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useCurrentMessageStore } from "../state/message";
import { useToasts } from "../util/toasts";
import EditorMoreMenu from "./EditorMoreMenu";

export default function EditorMenuBar() {
  const toasts = useToasts();

  const clear = useCurrentMessageStore((state) => state.clear);

  const [clearConfirm, setClearConfirm] = useState(false);
  const clearConfirmTimeout = useRef(0);

  function clearWithConfirm() {
    if (clearConfirm) {
      clear();
      setClearConfirm(false);
      clearTimeout(clearConfirmTimeout.current);
    } else {
      setClearConfirm(true);
      clearTimeout(clearConfirmTimeout.current);
      clearConfirmTimeout.current = setTimeout(() => {
        setClearConfirm(false);
        toasts.create({
          message: "Click twice to clear the message.",
        });
      }, 2000);
    }
  }

  return (
    <div className="flex justify-between items-center mb-5 mt-5">
      <div className="pl-5 bg-dark-2 py-1.5 pr-2 rounded-r">
        <div className="space-x-3.5 flex items-center">
          <Link to="/messages">
            <RectangleStackIcon className="text-white bg-dark-3 hover:bg-dark-4 rounded-full cursor-pointer p-2 w-9 h-9" />
          </Link>
          <Link to="/json">
            <CodeBracketSquareIcon className="text-white bg-dark-3 hover:bg-dark-4 rounded-full cursor-pointer p-2 w-9 h-9" />
          </Link>
          <TrashIcon
            className={clsx(
              "text-white rounded-full cursor-pointer p-2 w-9 h-9",
              clearConfirm ? "bg-red" : "bg-dark-3 hover:bg-dark-4"
            )}
            role="button"
            onClick={clearWithConfirm}
          />
          <Link to="/magic">
            <SparklesIcon className="text-white bg-dark-3 hover:bg-dark-4 rounded-full cursor-pointer p-2 w-9 h-9" />
          </Link>
          <Link to="/send">
            <PaperAirplaneIcon className="text-white bg-blurple hover:bg-blurple-dark rounded-full cursor-pointer p-2 w-9 h-9" />
          </Link>
        </div>
      </div>
      <div className="pr-5">
        <EditorMoreMenu />
      </div>
    </div>
  );
}

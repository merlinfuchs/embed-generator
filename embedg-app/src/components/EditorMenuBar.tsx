import {
  TrashIcon,
  CodeBracketSquareIcon,
  SparklesIcon,
  RectangleStackIcon,
  LinkIcon,
} from "@heroicons/react/20/solid";
import { Link } from "react-router-dom";
import EditorMoreMenu from "./EditorMoreMenu";
import { useUserQuery } from "../api/queries";

export default function EditorMenuBar() {
  /*

          <Link to="/send">
            <PaperAirplaneIcon className="text-white bg-blurple hover:bg-blurple-dark rounded-full cursor-pointer p-2 w-9 h-9" />
          </Link>
          */
  const { data: user } = useUserQuery();

  return (
    <div className="flex justify-between items-center mb-5 mt-5">
      <div className="pl-5 bg-dark-2 py-1.5 pr-2 rounded-r">
        <div className="space-x-3.5 flex items-center">
          <Button label="Clear Message" href="/clear">
            <TrashIcon />
          </Button>
          <Button label="Share Message" href="/share">
            <LinkIcon />
          </Button>
          <Button label="JSON Code" href="/json">
            <CodeBracketSquareIcon />
          </Button>
          <Button label="Messages" href="/messages">
            <RectangleStackIcon />
          </Button>
          {user?.success && user.data.is_tester && (
            <Button label="AI Assistant" href="/magic">
              <SparklesIcon />
            </Button>
          )}
        </div>
      </div>
      <div className="pr-5">
        <EditorMoreMenu />
      </div>
    </div>
  );
}

interface ButtonProps {
  label: string;
  children: React.ReactNode;
  href: string;
}

function Button({ label, children, href }: ButtonProps) {
  return (
    <Link
      className="text-white bg-dark-3 hover:bg-dark-4 rounded-full cursor-pointer p-2"
      to={href}
    >
      <div className="flex-none h-5 w-5" title={label}>
        {children}
      </div>
    </Link>
  );
}

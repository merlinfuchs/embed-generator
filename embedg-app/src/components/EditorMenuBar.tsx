import {
  TrashIcon,
  CodeBracketSquareIcon,
  SparklesIcon,
  LinkIcon,
} from "@heroicons/react/20/solid";
import { Link } from "react-router-dom";
import { useUserQuery } from "../api/queries";
import Tooltip from "./Tooltip";

export default function EditorMenuBar() {
  const { data: user } = useUserQuery();

  return (
    <div className="flex justify-end items-center mb-5 mt-5">
      <div className="space-x-3.5 flex items-center">
        {user?.success && user.data.is_tester && (
          <Button label="AI Assistant" href="/magic">
            <SparklesIcon />
          </Button>
        )}
        <Button label="Share Message" href="/editor/share">
          <LinkIcon />
        </Button>
        <Button label="JSON Code" href="/editor/json">
          <CodeBracketSquareIcon />
        </Button>
        <Button label="Clear Message" href="/editor/clear">
          <TrashIcon />
        </Button>
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
    <Tooltip text={label}>
      <Link
        className="text-white bg-dark-2 hover:bg-dark-3 rounded-full cursor-pointer p-2 block"
        to={href}
      >
        <div className="flex-none h-5 w-5">{children}</div>
      </Link>
    </Tooltip>
  );
}

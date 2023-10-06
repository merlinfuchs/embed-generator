import {
  TrashIcon,
  CodeBracketSquareIcon,
  SparklesIcon,
  LinkIcon,
} from "@heroicons/react/20/solid";
import { Link } from "react-router-dom";
import Tooltip from "./Tooltip";
import { usePremiumGuildFeatures } from "../util/premium";
import clsx from "clsx";

export default function EditorMenuBar() {
  const aiAssistantAllowed = usePremiumGuildFeatures()?.ai_assistant;

  return (
    <div className="flex justify-end items-center mb-5 mt-5">
      <div className="space-x-3.5 flex items-center">
        {aiAssistantAllowed && (
          <Button
            label="AI Assistant"
            href="/editor/assistant"
            highlight={true}
          >
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
  highlight?: boolean;
}

function Button({ label, children, href, highlight }: ButtonProps) {
  return (
    <Tooltip text={label}>
      <Link
        className={clsx(
          "bg-dark-2 hover:bg-dark-3 rounded-full cursor-pointer p-2 block",
          highlight ? "text-yellow" : "text-white"
        )}
        to={href}
      >
        <div className="flex-none h-5 w-5">{children}</div>
      </Link>
    </Tooltip>
  );
}

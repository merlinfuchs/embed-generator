import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";

export default function ToolsBackButton() {
  return (
    <div className="flex">
      <Link
        className="text-mist-300 hover:text-mist-100 flex space-x-3 items-center text-lg bg-ink-700 pl-2 pr-5 py-2 rounded-lg"
        to="/tools"
      >
        <ChevronLeftIcon className="h-7 w-7" />
        <div>Other Tools</div>
      </Link>
    </div>
  );
}

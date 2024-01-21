import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";

export default function ToolsBackButton() {
  return (
    <div className="flex">
      <Link
        className="text-gray-300 hover:text-gray-100 flex space-x-3 items-center text-lg bg-dark-3 pl-2 pr-5 py-2 rounded"
        to="/tools"
      >
        <ChevronLeftIcon className="h-7 w-7" />
        <div>Other Tools</div>
      </Link>
    </div>
  );
}

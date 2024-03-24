import { shallow } from "zustand/shallow";
import { useActivityStateStore } from "../state/activity";
import { ArrowPathIcon, XMarkIcon } from "@heroicons/react/24/outline";

export default function ActivityLoadingScreen() {
  const { loading, error } = useActivityStateStore((state) => state, shallow);

  if (loading) {
    return (
      <div className="fixed h-screen w-screen z-50 bg-dark-2 flex items-center justify-center">
        <ArrowPathIcon className="h-48 w-48 text-gray-300 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed h-screen w-screen z-50 bg-dark-2 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <XMarkIcon className="h-64 w-64 text-gray-300 mb-10" />
          <div className="text-lg text-gray-400 font-light mb-3">{error}</div>
          <div className="text-xl text-gray-300">
            Try to restart or join the activity again.
          </div>
        </div>
      </div>
    );
  }

  return null;
}

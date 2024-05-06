import { XMarkIcon } from "@heroicons/react/20/solid";
import { Link } from "react-router-dom";
import { useUpsellStateStore } from "../state/upsell";
import { useEffect, useState } from "react";

export default function UpsellPopup() {
  const shouldUpsell = useUpsellStateStore((s) => s.shouldUpsell);
  const setUpsellClosed = useUpsellStateStore((s) => s.setUpsellClosed);

  const [showUpsell, setShowUpsell] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowUpsell(shouldUpsell());
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [shouldUpsell]);

  if (!showUpsell) {
    return null;
  }

  return (
    <div className="fixed bottom-5 right-5 w-80 bg-dark-2 shadow-xl rounded-lg hidden lg:block px-5 py-4 z-10">
      <div className="flex justify-between">
        <div className="text-base text-gray-100 font-bold mb-1.5">
          Embed Generator ♥️
        </div>
        <XMarkIcon
          className="text-gray-300 hover:text-gray-100 w-5 h-5 cursor-pointer"
          role="button"
          onClick={() => {
            setUpsellClosed(true);
            setShowUpsell(false);
          }}
        />
      </div>
      <div className="text-sm text-gray-300 mb-4">
        This is an open source project and free to use. If you like it, consider
        supporting the project by getting premium or starring the project on
        Github.
      </div>
      <div className="flex space-x-3 text-center text-sm font-medium">
        <Link
          to="/premium"
          className="bg-yellow px-3 py-2 rounded block w-full"
        >
          Get Premium
        </Link>
        <a
          href="/source"
          target="_blank"
          className="bg-blurple px-3 py-2 rounded block w-full text-gray-100"
        >
          Star on Github
        </a>
      </div>
    </div>
  );
}

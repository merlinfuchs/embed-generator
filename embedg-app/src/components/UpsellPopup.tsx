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
    <div className="fixed bottom-5 right-5 w-80 bg-ink-700 border border-white/10 shadow-card rounded-xl hidden lg:block px-5 py-4 z-10">
      <div className="flex justify-between">
        <div className="text-base text-mist-100 font-bold mb-1.5">
          Embed Generator ♥️
        </div>
        <button
          type="button"
          aria-label="Dismiss"
          className="text-mist-300 hover:text-mist-100 cursor-pointer"
          onClick={() => {
            setUpsellClosed(true);
            setShowUpsell(false);
          }}
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>
      <div className="text-sm text-mist-300 mb-4">
        This is an open source project and free to use. If you like it, consider
        supporting the project by getting premium or starring the project on
        GitHub.
      </div>
      <div className="flex space-x-3 text-center text-sm font-medium">
        <Link
          to="/premium"
          className="bg-amber-400 hover:bg-amber-300 text-ink-900 px-3 py-2 rounded-lg block w-full transition-colors"
        >
          Get Premium
        </Link>
        <a
          href="/source"
          target="_blank"
          className="bg-azure-500 hover:bg-azure-400 px-3 py-2 rounded-lg block w-full text-white transition-colors"
          rel="noopener"
        >
          Star on GitHub
        </a>
      </div>
    </div>
  );
}

import {
  ArchiveBoxIcon,
  ClockIcon,
  CommandLineIcon,
  CpuChipIcon,
  FireIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

export default function UltimateFeatures() {
  return (
    <div className="space-y-5 px-3 py-2">
      <div className="flex items-center gap-4">
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-amber-400/15 text-amber-300">
          <SparklesIcon className="h-4 w-4" />
        </span>
        <div className="text-mist-300 text-sm">
          Everything in <span className="font-medium text-white">Premium</span>,
          with much higher limits for large servers
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-amber-400/15 text-amber-300">
          <ClockIcon className="h-4 w-4" />
        </span>
        <div className="text-mist-300 text-sm">
          Create up to{" "}
          <span className="font-medium text-white">100 scheduled messages</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-amber-400/15 text-amber-300">
          <ArchiveBoxIcon className="h-4 w-4" />
        </span>
        <div className="text-mist-300 text-sm">
          Save up to{" "}
          <span className="font-medium text-white">500 messages</span> and keep
          50 earlier versions of each
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-amber-400/15 text-amber-300">
          <CommandLineIcon className="h-4 w-4" />
        </span>
        <div className="text-mist-300 text-sm">
          Add up to{" "}
          <span className="font-medium text-white">50 custom commands</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-amber-400/15 text-amber-300">
          <FireIcon className="h-4 w-4" />
        </span>
        <div className="text-mist-300 text-sm">
          Add up to <span className="font-medium text-white">20 actions</span>{" "}
          to each interactive component
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-amber-400/15 text-amber-300">
          <CpuChipIcon className="h-4 w-4" />
        </span>
        <div className="text-mist-300 text-sm">
          Use the <span className="font-medium text-white">AI assistant</span>{" "}
          up to 250 times a month
        </div>
      </div>
    </div>
  );
}

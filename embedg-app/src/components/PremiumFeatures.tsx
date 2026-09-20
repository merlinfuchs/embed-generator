import {
  FireIcon,
  CpuChipIcon,
  CommandLineIcon,
  TagIcon,
  ClockIcon,
  SquaresPlusIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon } from "@heroicons/react/24/solid";

export default function PremiumFeatures() {
  return (
    <div className="space-y-5 px-3 py-2">
      <div className="flex items-center gap-4">
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-amber-400/15 text-amber-300">
          <CpuChipIcon className="h-4 w-4" />
        </span>
        <div className="text-mist-300 text-sm">
          Get a personal{" "}
          <span className="font-medium text-white">AI assistant</span> that
          helps you creating beautiful and unique messages
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-amber-400/15 text-amber-300">
          <TagIcon className="h-4 w-4" />
        </span>
        <div className="text-mist-300 text-sm">
          Add your <span className="font-medium text-white">custom bot</span> to
          change the username and avatar on interaction responses and custom
          commands
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-amber-400/15 text-amber-300">
          <CommandLineIcon className="h-4 w-4" />
        </span>
        <div className="text-mist-300 text-sm">
          Add <span className="font-medium text-white">custom commands</span>{" "}
          with your own branding to your server that can be used by anyone
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-amber-400/15 text-amber-300">
          <FireIcon className="h-4 w-4" />
        </span>
        <div className="text-mist-300 text-sm">
          Add up to <span className="font-medium text-white">10 actions</span>{" "}
          to each interactive component and save up to{" "}
          <span className="font-medium text-white">100 messages</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-amber-400/15 text-amber-300">
          <ClockIcon className="h-4 w-4" />
        </span>
        <div className="text-mist-300 text-sm">
          Create scheduled messages that are sent{" "}
          <span className="font-medium text-white">
            periodically multiple times
          </span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-amber-400/15 text-amber-300">
          <SquaresPlusIcon className="h-4 w-4" />
        </span>
        <div className="text-mist-300 text-sm">
          Get access to{" "}
          <span className="font-medium text-white">more components v2</span> to
          create more complex messages
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-amber-400/15 text-red">
          <HeartIcon className="h-4 w-4" />
        </span>
        <div className="text-mist-300 text-sm">
          By subscribing to premium you make sure that Embed Generator can
          continue to exist and be updated
        </div>
      </div>
    </div>
  );
}

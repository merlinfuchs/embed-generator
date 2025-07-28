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
    <div className="space-y-2">
      <div className="p-4 bg-dark-3 rounded flex space-x-3 items-center">
        <CpuChipIcon className="w-5 h-5 text-green flex-none" />
        <div className="text-gray-400 font-light text-sm">
          Get a personal{" "}
          <span className="font-medium text-white">AI assistant</span> that
          helps you creating beautiful and unique messages
        </div>
      </div>
      <div className="p-4 bg-dark-3 rounded flex space-x-3 items-center">
        <TagIcon className="w-5 h-5 text-green flex-none" />
        <div className="text-gray-400 font-light text-sm">
          Add your <span className="font-medium text-white">custom bot</span> to
          change the username and avatar on interaction responses and custom
          commands
        </div>
      </div>
      <div className="p-4 bg-dark-3 rounded flex space-x-3 items-center">
        <CommandLineIcon className="w-5 h-5 text-green flex-none" />
        <div className="text-gray-400 font-light text-sm">
          Add <span className="font-medium text-white">custom commands</span>{" "}
          with your own branding to your server that can be used by anyone
        </div>
      </div>
      <div className="p-4 bg-dark-3 rounded flex space-x-3 items-center">
        <FireIcon className="w-5 h-5 text-green flex-none" />
        <div className="text-gray-400 font-light text-sm">
          Add up to <span className="font-medium text-white">10 actions</span>{" "}
          to each interactive component and save up to{" "}
          <span className="font-medium text-white">100 messages</span>
        </div>
      </div>
      <div className="p-4 bg-dark-3 rounded flex space-x-3 items-center">
        <ClockIcon className="w-5 h-5 text-green flex-none" />
        <div className="text-gray-400 font-light text-sm">
          Create scheduled messages that are sent{" "}
          <span className="font-medium text-white">
            periodically multiple times
          </span>
        </div>
      </div>
      <div className="p-4 bg-dark-3 rounded flex space-x-3 items-center">
        <SquaresPlusIcon className="w-5 h-5 text-green flex-none" />
        <div className="text-gray-400 font-light text-sm">
          Get access to{" "}
          <span className="font-medium text-white">more components v2</span> to
          create more complex messages
        </div>
      </div>
      <div className="p-4 bg-dark-3 rounded flex space-x-3 items-center">
        <HeartIcon className="w-5 h-5 text-red flex-none" />
        <div className="text-gray-400 font-light text-sm">
          By subscribing to premium you make sure that Embed Generator can
          continue to exist and be updated
        </div>
      </div>
    </div>
  );
}

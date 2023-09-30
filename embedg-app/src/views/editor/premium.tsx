import {
  ArrowUpTrayIcon,
  ChatBubbleLeftIcon,
  CursorArrowRippleIcon,
  PhotoIcon,
  SparklesIcon,
  StarIcon,
} from "@heroicons/react/20/solid";
import {
  usePremiumGuildEntitlementsQuery,
  useUserQuery,
} from "../../api/queries";
import EditorModal from "../../components/EditorModal";
import LogginSuggest from "../../components/LoginSuggest";
import { useSendSettingsStore } from "../../state/sendSettings";
import GuildSelect from "../../components/GuildSelect";
import { shallow } from "zustand/shallow";

export default function PremiumView() {
  const [guildId, setGuildId] = useSendSettingsStore(
    (state) => [state.guildId, state.setGuildId],
    shallow
  );

  const { data: user } = useUserQuery();

  const { data } = usePremiumGuildEntitlementsQuery(guildId);

  const hasEntitlement = data?.success && data.data.entitlements.length !== 0;

  return (
    <EditorModal width="md">
      <div className="p-5">
        {user && user.success ? (
          <div>
            <div className="flex items-center px-3 py-3 space-x-3 mb-4">
              <StarIcon className="text-yellow h-14 w-14 flex-none" />
              <div className="flex-auto">
                <div className="text-base font-bold text-white">
                  Embed Generator <span className="text-yellow">Premium</span>
                </div>
                <div className="text-light text-sm text-gray-400">
                  {guildId && hasEntitlement
                    ? "You are subscribed to Embed Generator Premium and have access to all features!"
                    : "Subscribe to Embed Generator Premium to unlock all features!"}
                </div>
              </div>
            </div>
            <GuildSelect guildId={guildId} onChange={setGuildId} />
            <div className="space-y-2 mt-4 mb-5">
              <div className="p-4 bg-dark-2 rounded flex space-x-3 items-center">
                <ArrowUpTrayIcon className="w-5 h-5 text-green flex-none" />
                <div className="text-gray-400 font-light text-sm">
                  Save up to{" "}
                  <span className="font-medium text-white">50 messages</span>{" "}
                  and load them whenever you need them
                </div>
              </div>
              <div className="p-4 bg-dark-2 rounded flex space-x-3 items-center">
                <PhotoIcon className="w-5 h-5 text-green flex-none" />
                <div className="text-gray-400 font-light text-sm">
                  Save attachments with your messages
                </div>
              </div>
              <div className="p-4 bg-dark-2 rounded flex space-x-3 items-center">
                <SparklesIcon className="w-5 h-5 text-green flex-none" />
                <div className="text-gray-400 font-light text-sm">
                  Get an{" "}
                  <span className="font-medium text-white">AI assistant</span>{" "}
                  that helps you create good looking messages
                </div>
              </div>
              <div className="p-4 bg-dark-2 rounded flex space-x-3 items-center">
                <ChatBubbleLeftIcon className="w-5 h-5 text-green flex-none" />
                <div className="text-gray-400 font-light text-sm">
                  Respond to interactive components with a saved message
                  including embeds and other interactive components
                </div>
              </div>
              <div className="p-4 bg-dark-2 rounded flex space-x-3 items-center">
                <CursorArrowRippleIcon className="w-5 h-5 text-green flex-none" />
                <div className="text-gray-400 font-light text-sm">
                  Perform up to{" "}
                  <span className="font-medium text-white">5 actions</span> for
                  each interactive component on your message
                </div>
              </div>
            </div>
          </div>
        ) : (
          <LogginSuggest />
        )}
      </div>
    </EditorModal>
  );
}

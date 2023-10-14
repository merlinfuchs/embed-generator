import { useCustomCmmandsQuery, useUserQuery } from "../api/queries";
import LogginSuggest from "../components/LoginSuggest";
import { useSendSettingsStore } from "../state/sendSettings";
import { usePremiumGuildFeatures } from "../util/premium";
import CustomCommand from "../components/CustomCommand";
import CustomCommandCreate from "../components/CustomCommandCreate";
import { SparklesIcon } from "@heroicons/react/24/solid";
import { useMemo, useState } from "react";
import { useCustomCommandsDeployMutation } from "../api/mutations";
import { parseISO } from "date-fns";
import clsx from "clsx";
import { AutoAnimate } from "../util/autoAnimate";
import { useToasts } from "../util/toasts";
import PremiumSuggest from "../components/PremiumSuggest";

export default function CommandsView() {
  const { data: user } = useUserQuery();
  const createToast = useToasts((s) => s.create);

  const [create, setCreate] = useState(false);

  const guildId = useSendSettingsStore((s) => s.guildId);
  const features = usePremiumGuildFeatures();

  const commandsQuery = useCustomCmmandsQuery(guildId);
  const commandCount = commandsQuery.data?.success
    ? commandsQuery.data.data.length
    : 0;

  const guildFeatures = usePremiumGuildFeatures(guildId);
  const maxCommands = guildFeatures?.max_custom_commands || 0;

  const deployMutation = useCustomCommandsDeployMutation();

  const hasUndeployedChanges =
    commandsQuery.data?.success &&
    commandsQuery.data.data.some(
      (cmd) =>
        !cmd.deployed_at || parseISO(cmd.updated_at) > parseISO(cmd.deployed_at)
    );

  function deploy() {
    if (!guildId || !hasUndeployedChanges) return;

    deployMutation.mutate(
      {
        guildId,
      },
      {
        onSuccess: (res) => {
          if (res.success) {
            commandsQuery.refetch();
          } else {
            createToast({
              title: "Failed to deploy commands",
              message: res.error.message,
              type: "error",
            });
          }
        },
      }
    );
  }

  const commands = useMemo(() => {
    if (!commandsQuery.data?.success) return [];

    const commands = commandsQuery.data.data;
    commands.sort((a, b) => a.name.localeCompare(b.name));
    return commands;
  }, [commandsQuery.data]);

  return (
    <div className="overflow-y-auto w-full">
      <div className="flex flex-col max-w-5xl mx-auto px-4 w-full my-5 lg:my-20">
        <div className="mb-10">
          <div className="text-white font-medium mb-3 flex items-center space-x-3">
            <SparklesIcon className="h-7 w-7 text-yellow" />
            <div className="text-2xl">Custom Commands</div>
            <div className="font-light italic text-gray-400 flex-none">
              {commandCount} / {maxCommands}
            </div>
          </div>
          <div className="text-gray-400 font-light text-sm">
            You can create custom commands to add more functionality to your
            custom bot. You need to configure a custom bot first which is
            available to servers with premium in the settings.
          </div>
        </div>
        {user?.success ? (
          features?.max_custom_commands ? (
            <div className="space-y-5 mb-8">
              <AutoAnimate className="space-y-5 overlfow-y-auto">
                {commands.map((cmd) => (
                  <CustomCommand cmd={cmd} key={cmd.id} />
                ))}
                {(commands.length === 0 || create) && (
                  <CustomCommandCreate
                    setCreate={setCreate}
                    cancelable={commands.length !== 0}
                  />
                )}
              </AutoAnimate>
              <div className="flex space-x-3 justify-end">
                <button
                  className={clsx(
                    "px-3 py-2 rounded text-white",
                    hasUndeployedChanges
                      ? "bg-blurple hover:bg-blurple-dark"
                      : "bg-dark-2 cursor-not-allowed"
                  )}
                  onClick={deploy}
                >
                  Deploy Commands
                </button>
                <button
                  className={clsx(
                    "px-3 py-2 rounded border-2 text-white",
                    commands.length < maxCommands
                      ? "border-dark-7 hover:bg-dark-6 cursor-pointer"
                      : "border-dark-6 text-gray-300 cursor-not-allowed"
                  )}
                  onClick={() =>
                    commands.length < maxCommands && setCreate(true)
                  }
                >
                  New Command
                </button>
              </div>
            </div>
          ) : (
            <PremiumSuggest alwaysExpanded={true} />
          )
        ) : (
          <LogginSuggest alwaysExpanded={true} />
        )}
      </div>
    </div>
  );
}

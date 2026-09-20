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
        !cmd.deployed_at ||
        parseISO(cmd.updated_at) > parseISO(cmd.deployed_at),
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
      },
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
            <SparklesIcon className="h-7 w-7 text-amber-300" />
            <div className="text-2xl">Custom Commands</div>
            <div className="font-light italic text-mist-400 flex-none">
              {commandCount} / {maxCommands}
            </div>
          </div>
          <div className="text-mist-400 font-light text-sm">
            You can create custom commands to add more functionality to your
            custom bot. You need to configure a custom bot first which is
            available to servers with premium in the settings.
          </div>
        </div>
        {user?.success ? (
          features?.max_custom_commands ? (
            <div className="space-y-5 mb-8">
              <AutoAnimate className="space-y-5 overflow-y-auto">
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
                    "px-3 py-2 rounded-lg text-white",
                    hasUndeployedChanges
                      ? "bg-azure-500 hover:bg-azure-400"
                      : "bg-ink-900 cursor-not-allowed",
                  )}
                  onClick={deploy}
                >
                  Deploy Commands
                </button>
                <button
                  className={clsx(
                    "px-3 py-2 rounded-lg border-2",
                    commands.length < maxCommands
                      ? "border-white/15 hover:bg-white/5 hover:border-white/30 cursor-pointer"
                      : "border-white/10 text-mist-500 cursor-not-allowed",
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

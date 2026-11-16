import { useState } from "react";
import { useFormsQuery, useUserQuery } from "../api/queries";
import FormCard from "../components/FormCard";
import FormCreate from "../components/FormCreate";
import LimitButton from "../components/LimitButton";
import LogginSuggest from "../components/LoginSuggest";
import { useSendSettingsStore } from "../state/sendSettings";
import { AutoAnimate } from "../util/autoAnimate";
import { usePremiumGuildFeatures } from "../util/premium";

export default function FormsView() {
  const { data: user } = useUserQuery();

  const [create, setCreate] = useState(false);

  const guildId = useSendSettingsStore((s) => s.guildId);

  const formsQuery = useFormsQuery(guildId);
  const forms = formsQuery.data?.success ? formsQuery.data.data : [];

  const guildFeatures = usePremiumGuildFeatures(guildId);
  const maxForms = guildFeatures?.max_forms || 0;

  return (
    <div className="overflow-y-auto w-full">
      <div className="flex flex-col max-w-7xl mx-auto px-4 w-full my-5 lg:my-20">
        <div className="mb-10">
          <div className="text-white font-medium mb-3 flex items-center space-x-3">
            <div className="text-2xl">Forms</div>
            <div className="font-light italic text-mist-400 flex-none">
              {forms.length} / {maxForms}
            </div>
          </div>
          <div className="text-mist-400 font-light text-sm">
            Forms are pop-ups that ask members for text, or to pick users,
            roles, channels or options. Open one from a button, a select menu or
            a custom command by adding a Show Form action, and use their answers
            in the form's own actions with variables like{" "}
            <code>{"{{.Form.reason}}"}</code>.
          </div>
        </div>
        {user?.success ? (
          guildId ? (
            <div className="space-y-5 mb-8">
              <AutoAnimate className="space-y-5">
                {forms.map((form) => (
                  <FormCard form={form} key={form.id} />
                ))}
                {(forms.length === 0 || create) && (
                  <FormCreate
                    setCreate={setCreate}
                    cancelable={forms.length !== 0}
                  />
                )}
              </AutoAnimate>
              <div className="flex space-x-3 justify-end">
                <LimitButton
                  limit="max_forms"
                  features={guildFeatures}
                  count={forms.length}
                  className="px-3 py-2 rounded-lg border-2 border-white/15 hover:bg-white/5 hover:border-white/30 cursor-pointer"
                  onClick={() => setCreate(true)}
                >
                  New Form
                </LimitButton>
              </div>
            </div>
          ) : (
            <div className="text-mist-300">
              Select a server at the top to manage its forms.
            </div>
          )
        ) : (
          <LogginSuggest alwaysExpanded={true} />
        )}
      </div>
    </div>
  );
}

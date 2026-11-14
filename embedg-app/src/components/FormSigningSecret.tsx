import {
  ClipboardIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/20/solid";
import { useState } from "react";
import { useFormActionsStore } from "../state/actions";
import { useToasts } from "../util/toasts";

interface Props {
  formId: string;
  /** Null until the form is saved. */
  secret: string | null;
}

/**
 * The secret that the answers a form sends to a URL are signed with. It's
 * only shown when one of the form's actions sends them.
 */
export default function FormSigningSecret({ formId, secret }: Props) {
  const sendsAnswers = useFormActionsStore(
    (s) => s.actions[formId]?.actions.some((a) => a.type === 14) ?? false,
  );
  const createToast = useToasts((s) => s.create);
  const [revealed, setRevealed] = useState(false);

  if (!sendsAnswers) return null;

  function copy() {
    if (!secret) return;
    navigator.clipboard.writeText(secret).then(
      () =>
        createToast({
          title: "Copied",
          message: "The signing secret is on your clipboard.",
          type: "success",
        }),
      () =>
        createToast({
          title: "Couldn't copy",
          message: "Select the secret and copy it yourself.",
          type: "error",
        }),
    );
  }

  return (
    <div>
      <div className="mb-1.5 uppercase text-mist-300 text-sm font-medium">
        Signing Secret
      </div>
      <div className="text-sm text-mist-400 mb-2">
        Your server can use it to check that answers come from Embed Generator.{" "}
        <a
          href="https://message.style/docs/guides/forms#sending-answers-to-other-tools"
          target="_blank"
          rel="noreferrer"
          className="text-azure-300 hover:underline"
        >
          How to check it
        </a>
      </div>
      {secret ? (
        <div className="flex items-center gap-2">
          <input
            readOnly
            aria-label="Signing secret"
            type={revealed ? "text" : "password"}
            value={secret}
            className="bg-ink-900 rounded-lg px-3 py-2 w-full font-mono text-sm text-white min-w-0"
            onFocus={(e) => e.target.select()}
          />
          <button
            type="button"
            aria-label={revealed ? "Hide secret" : "Show secret"}
            className="flex-none bg-ink-900 rounded-lg p-2 text-mist-300 hover:text-white"
            onClick={() => setRevealed(!revealed)}
          >
            {revealed ? (
              <EyeSlashIcon className="h-5 w-5" />
            ) : (
              <EyeIcon className="h-5 w-5" />
            )}
          </button>
          <button
            type="button"
            aria-label="Copy secret"
            className="flex-none bg-ink-900 rounded-lg p-2 text-mist-300 hover:text-white"
            onClick={copy}
          >
            <ClipboardIcon className="h-5 w-5" />
          </button>
        </div>
      ) : (
        <div className="text-sm text-mist-300">
          Save the form to get its signing secret.
        </div>
      )}
    </div>
  );
}

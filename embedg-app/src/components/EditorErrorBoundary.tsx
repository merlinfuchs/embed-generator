import type { ReactNode } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { clearCurrentMessage } from "../state/currentMessage";

export default function EditorErrorBoundary({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ErrorBoundary fallbackRender={ErrorFallback} onReset={clearCurrentMessage}>
      {children}
    </ErrorBoundary>
  );
}

function ErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 text-mist-100 p-5">
      <div className="text-lg">Editor Error</div>
      <div className="text-mist-300 mb-2">
        The editor encountered an error. Please report this to the developers
        with the following error message:
      </div>
      <pre className="bg-ink-900 rounded-xl p-3 font-mono text-sm mb-2">
        {`${error}\n\n${error.stack}`}
      </pre>
      <div className="flex ">
        <button
          onClick={resetErrorBoundary}
          className="bg-azure-500 rounded-xl py-2 px-4"
        >
          Reset Editor
        </button>
      </div>
    </div>
  );
}

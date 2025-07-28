import { ReactNode } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useCurrentMessageStore } from "../state/message";

export default function EditorErrorBoundary({
  children,
}: {
  children: ReactNode;
}) {
  const clearMessage = useCurrentMessageStore((s) => s.clear);

  return (
    <ErrorBoundary fallbackRender={ErrorFallback} onReset={clearMessage}>
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
    <div className="flex flex-col gap-2 text-gray-100 p-5">
      <div className="text-lg">Editor Error</div>
      <div className="text-gray-300 mb-2">
        The editor encountered an error. Please report this to the developers
        with the following error message:
      </div>
      <pre className="bg-dark-2 rounded-md p-3 font-mono text-sm mb-2">
        {`${error}\n\n${error.stack}`}
      </pre>
      <div className="flex ">
        <button
          onClick={resetErrorBoundary}
          className="bg-blurple rounded-md py-2 px-4"
        >
          Reset Editor
        </button>
      </div>
    </div>
  );
}
